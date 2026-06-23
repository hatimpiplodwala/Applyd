output "api_endpoint" {
  description = "Public HTTPS endpoint via API Gateway. Point NEXT_PUBLIC_API_URL / VITE_API_URL here."
  value       = aws_apigatewayv2_api.http.api_endpoint
}

output "function_url" {
  description = "Lambda Function URL (blocked on this account; kept for reference). Prefer api_endpoint."
  value       = aws_lambda_function_url.backend.function_url
}

output "ecr_repository_url" {
  description = "ECR repo to push images to."
  value       = aws_ecr_repository.backend.repository_url
}

output "deploy_role_arn" {
  description = "Set as the AWS_DEPLOY_ROLE_ARN GitHub Actions variable."
  value       = aws_iam_role.deploy.arn
}

output "aws_region" {
  description = "Set as the AWS_REGION GitHub Actions variable."
  value       = var.aws_region
}

output "ecr_repository_name" {
  description = "Set as the ECR_REPOSITORY GitHub Actions variable."
  value       = aws_ecr_repository.backend.name
}

output "lambda_function_name" {
  description = "Set as the LAMBDA_FUNCTION GitHub Actions variable."
  value       = aws_lambda_function.backend.function_name
}
