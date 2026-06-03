from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.middleware import SlowAPIMiddleware

from app.config import get_settings
from app.limiter import limiter
from app.routers import applications, parse

settings = get_settings()

app = FastAPI(title="Job Tracker API", version="2.0.0")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# SlowAPIMiddleware applies default_limits (200/min) to all routes.
# CORSMiddleware added after so it sits outermost — OPTIONS preflights
# bypass rate limiting.
app.add_middleware(SlowAPIMiddleware)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Content-Type", "Authorization"],
)


# Defense-in-depth response headers. This is a JSON API consumed by the SPA, so
# these are cheap belt-and-suspenders: stop content sniffing, deny framing, and
# don't leak the URL in the Referer header to third parties.
@app.middleware("http")
async def security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers.setdefault("X-Content-Type-Options", "nosniff")
    response.headers.setdefault("X-Frame-Options", "DENY")
    response.headers.setdefault("Referrer-Policy", "no-referrer")
    return response


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(applications.router)
app.include_router(parse.router)
