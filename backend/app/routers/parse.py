import logging

from fastapi import APIRouter, Depends, HTTPException, Request, status

from app.config import get_settings
from app.deps import get_current_user
from app.limiter import limiter
from app.schemas import ParseRequest, ParseUrlResponse
from app.services.job_parser import parse_job

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/applications", tags=["applications"])


@router.post("/parse-url", response_model=ParseUrlResponse)
@limiter.limit("10/minute")
def parse(
    request: Request,
    payload: ParseRequest,
    _user=Depends(get_current_user),
) -> ParseUrlResponse:
    settings = get_settings()
    if not settings.gemini_api_key:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="AI parsing is not configured on this server",
        )

    logger.info(
        "parse-url user=%s source=%s",
        _user.id,
        payload.url or "(pasted text)",
    )
    return parse_job(
        url=payload.url,
        text=payload.text,
        api_key=settings.gemini_api_key,
    )
