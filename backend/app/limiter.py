from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def client_ip(request: Request) -> str:
    """Rate-limit key: the real client IP behind the platform proxy.

    Render/Railway terminate TLS and forward over HTTP, so request.client.host
    is the proxy, not the user. The platform edge *appends* the real client IP
    as the rightmost X-Forwarded-For entry; we read that. The rightmost is the
    one a trusted single-hop proxy adds, so (unlike the leftmost) a client can't
    spoof it by sending its own X-Forwarded-For header. Falls back to the peer
    address for local/direct runs with no proxy.
    """
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[-1].strip()
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip, default_limits=["200/minute"])
