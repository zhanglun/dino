FROM python:3.12-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim

COPY --from=builder /root/.local /usr/local
COPY . /app

EXPOSE 5000

# 同时启动Web和Celery Worker (仅限单节点)
CMD sh -c "flask -A app run && \
           celery -A app.celery worker --loglevel=info"
