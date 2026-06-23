# FastAPI on AWS Lambda, as a container image.
#
# The AWS base image ships the Lambda Runtime Interface Client, and locally it
# also bundles the Runtime Interface Emulator — so the exact same image runs in
# Lambda and on your machine (see docker-compose.yml). Build context is backend/.
FROM public.ecr.aws/lambda/python:3.12

# Dependencies first, in their own layer, so code edits don't re-install them.
COPY requirements.txt ${LAMBDA_TASK_ROOT}/
RUN pip install --no-cache-dir -r ${LAMBDA_TASK_ROOT}/requirements.txt

# Application code only (tests, envs, and docs are excluded via .dockerignore).
COPY main.py ${LAMBDA_TASK_ROOT}/
COPY app/ ${LAMBDA_TASK_ROOT}/app/

# main.py defines `handler = Mangum(app)`.
CMD ["main.handler"]
