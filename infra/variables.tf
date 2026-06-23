variable "aws_region" {
  description = "AWS region. Keep everything in one region to stay on the free tier."
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name prefix for the ECR repo, Lambda function, and IAM roles."
  type        = string
  default     = "applyd-backend"
}

variable "github_repo" {
  description = "Repo allowed to deploy via GitHub OIDC, as \"owner/repo\"."
  type        = string
}

variable "create_github_oidc_provider" {
  description = "Create the GitHub Actions OIDC provider. Set false if your account already has one (AWS allows only one per account)."
  type        = bool
  default     = true
}

variable "lambda_memory_mb" {
  description = "Lambda memory (MB); also scales CPU. 512 is a good balance and stays well within free GB-seconds at low traffic."
  type        = number
  default     = 512
}

variable "lambda_timeout_seconds" {
  description = "Lambda timeout. The parse endpoint fetches a URL and calls Gemini, so allow headroom."
  type        = number
  default     = 30
}

variable "log_retention_days" {
  description = "CloudWatch log retention. Short retention keeps storage within the free tier."
  type        = number
  default     = 7
}

variable "cors_origins" {
  description = "Comma-separated allowed origins (your Vercel domain[s])."
  type        = string
  default     = "http://localhost:3000"
}

variable "supabase_url" {
  description = "Supabase project URL."
  type        = string
}

variable "supabase_anon_key" {
  description = "Supabase anon key (public-by-design, but kept out of version control)."
  type        = string
  sensitive   = true
}

variable "gemini_api_key" {
  description = "Optional Gemini API key. Empty disables POST /applications/parse-url."
  type        = string
  default     = ""
  sensitive   = true
}
