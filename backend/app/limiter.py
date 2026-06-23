from slowapi import Limiter
from slowapi.util import get_remote_address
from starlette.requests import Request


def client_ip(request: Request) -> str:
    """Rate-limit key: the real client IP, unspoofable behind API Gateway.

    On Lambda behind API Gateway (the production deploy), Mangum sets
    request.client.host from requestContext.http.sourceIp — the source IP API
    Gateway recorded for the TCP connection. That's a context value, not a
    request header, so a client cannot forge it to dodge per-IP limits. It is
    also the real peer address for local/direct runs. We deliberately do NOT
    read X-Forwarded-For, which any client can set.
    """
    return get_remote_address(request)


limiter = Limiter(key_func=client_ip, default_limits=["200/minute"])
