from app import create_app
from app.extensions import extensions

app = create_app()  # 确保配置加载
extensions.init_celery(app)  # 显式初始化

celery = extensions.celery

if __name__ == '__main__':
  celery.start()
