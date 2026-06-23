# ---------------------------------------------------------------------------
# Public HTTP API in front of the Lambda.
#
# Used because this AWS account blocks anonymous Lambda Function URL invokes (a
# Function-URL-specific restriction AWS applies to some accounts — the function
# itself works fine via authenticated invoke). API Gateway calls the function
# with its own service principal (a normal authenticated invoke) and exposes a
# separate public endpoint, sidestepping that block. Payload format 2.0 matches
# what Mangum already parses, so no app changes are needed.
# ---------------------------------------------------------------------------
resource "aws_apigatewayv2_api" "http" {
  name          = "${var.project_name}-http"
  protocol_type = "HTTP"
  # No cors_configuration: FastAPI's CORSMiddleware answers preflights, keeping a
  # single source of truth (same as the Function URL setup).
}

resource "aws_apigatewayv2_integration" "lambda" {
  api_id                 = aws_apigatewayv2_api.http.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.backend.invoke_arn
  payload_format_version = "2.0"
}

# Catch-all: every method and path is proxied to the Lambda.
resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.http.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.lambda.id}"
}

# $default stage auto-deploys and serves at the API root (no /stage prefix).
resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.http.id
  name        = "$default"
  auto_deploy = true

  # Edge throttling: caps abuse of the public endpoint before it reaches Lambda,
  # protecting both the free tier and the backend. This is the robust gate; the
  # app's in-process SlowAPI limit is per-instance and best-effort on Lambda.
  # Generous for real use (no human drives 20 req/s), tight enough to stop a
  # script hammering the URL.
  default_route_settings {
    throttling_rate_limit  = 20
    throttling_burst_limit = 40
  }
}

resource "aws_lambda_permission" "apigw" {
  statement_id  = "AllowApiGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.http.execution_arn}/*/*"
}
