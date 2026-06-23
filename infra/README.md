# infra/ — backend on AWS Lambda (Terraform)

Provisions the backend's cloud footprint: an ECR repository, the Lambda function
(container image) fronted by a public **API Gateway HTTP API**, a CloudWatch log group
with short retention, and a **GitHub OIDC** role so CI can deploy with no stored AWS keys.

Everything here runs at effectively $0 on the AWS free tier: Lambda's 1M requests/month
is always free, and API Gateway + ECR are free for the first 12 months. After that it's
about $1 per million API Gateway requests plus a few cents of ECR image storage —
negligible at portfolio traffic, and a lifecycle policy keeps just the latest image.

## One-time setup

```bash
cd infra
cp terraform.tfvars.example terraform.tfvars   # then edit it
terraform init
```

A Lambda container function needs an image to exist *before* it can be created, so the
first run is two-staged:

```bash
# 1. Create just the registry.
terraform apply -target=aws_ecr_repository.backend

# 2. Build and push the first image as :latest.
# A -target apply does NOT write root outputs, so don't use `terraform output`
# here — read the region from your tfvars and the repo URI straight from AWS.
AWS_REGION=us-east-1   # match terraform.tfvars
ECR_URL=$(aws ecr describe-repositories --repository-names applyd-backend \
  --region "$AWS_REGION" --query 'repositories[0].repositoryUri' --output text)
aws ecr get-login-password --region "$AWS_REGION" \
  | docker login --username AWS --password-stdin "${ECR_URL%/*}"
# --provenance=false keeps this a single manifest (Lambda rejects an OCI index).
docker build --provenance=false -t "$ECR_URL:latest" ../backend
docker push "$ECR_URL:latest"

# 3. Create everything else (Lambda, API Gateway, OIDC role, logs).
terraform apply
```

On **Windows PowerShell**, the `$(...)` captures and `-target` above are bash-isms.
Use this instead (note the quoted `-target` — unquoted, PowerShell splits it at the
dot and Terraform rejects it):

```powershell
# 1. Create just the registry.
terraform apply "-target=aws_ecr_repository.backend"

# 2. Build and push the first image as :latest.
# A -target apply doesn't write root outputs, so read the repo URI from AWS.
$awsRegion = "us-east-1"   # match terraform.tfvars
$ecrUrl    = aws ecr describe-repositories --repository-names applyd-backend --region $awsRegion --query "repositories[0].repositoryUri" --output text
$registry  = $ecrUrl.Split('/')[0]
# PowerShell's native pipe corrupts --password-stdin (it appends CRLF, and ECR
# then rejects the token with a 400). Run the login pipe through cmd, which is
# byte-accurate.
cmd /c "aws ecr get-login-password --region $awsRegion | docker login --username AWS --password-stdin $registry"
# --provenance=false keeps this a single manifest (Lambda rejects an OCI index).
docker build --provenance=false -t "${ecrUrl}:latest" ../backend
docker push "${ecrUrl}:latest"

# 3. Create everything else (Lambda, API Gateway, OIDC role, logs).
terraform apply
```

## Wire up CI and the frontend

`terraform output` gives you the values to set:

| Output | Where it goes |
|---|---|
| `deploy_role_arn` | GitHub repo variable `AWS_DEPLOY_ROLE_ARN` |
| `aws_region` | GitHub repo variable `AWS_REGION` |
| `ecr_repository_name` | GitHub repo variable `ECR_REPOSITORY` |
| `lambda_function_name` | GitHub repo variable `LAMBDA_FUNCTION` |
| `api_endpoint` | Vercel `NEXT_PUBLIC_API_URL` and extension `VITE_API_URL` |

After that, pushes to `main` that touch `backend/**` deploy automatically via
`.github/workflows/deploy-backend.yml`.

## Notes

- `terraform.tfvars` and `*.tfstate` contain secrets and are gitignored. Only the
  `.example` file and the provider lock are committed.
- The public endpoint is an **API Gateway HTTP API** (`api_endpoint`), not the Lambda
  Function URL. AWS blocks anonymous Function URL invokes on some accounts (this one
  included), so API Gateway fronts the function instead — same payload format, no app
  changes. The Function URL resource still exists but is unused.
- If your account already has a GitHub Actions OIDC provider, set
  `create_github_oidc_provider = false` (AWS allows only one per account).
- Tear it all down with `terraform destroy` (the ECR repo is `force_delete`, so its
  images go too).
