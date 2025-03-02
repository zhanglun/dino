FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN pip install gunicorn

COPY . .

# 同时启动Web和Celery Worker (仅限单节点)
CMD sh -c "celery -A celery_worker.celery worker --loglevel=info && \
          gunicorn --bind 0.0.0.0:5000 --workers=4 app:create_app\(\)"
