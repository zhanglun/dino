import time
import requests
from celery import shared_task
from flask import current_app
from app.services.pubchem_client import fetch_compound
from app.models.compound import CompoundModel

@shared_task(ignore_result=False)
def add_together(a: int, b: int) -> int:
  return a + b

@shared_task(
  bind=True,
  autoretry_for=(requests.exceptions.RequestException,),
  max_retries=3,
  retry_backoff=30
)
def chem_analysis(self, chemical_identifier):
  try:
    # 阶段1：数据获取
    self.update_state(state='PROGRESS', meta={'progress': 30})
    data = fetch_compound(chemical_identifier)
    print('data', data)

    with current_app.app_context():  # 手动激活应用上下文
      cm = CompoundModel();
      cm.save_compound(data)

    # 阶段2：数据存储
    self.update_state(state='PROGRESS', meta={'progress': 70})
    # compound = Compound(**data).save()
    time.sleep(10)

    # 阶段3：附加计算（示例）
    self.update_state(state='PROGRESS', meta={'progress': 90})
    time.sleep(10)

    # calc_result = do_molecular_calculation(data['smiles'])

    # return {'cid': cid, 'calc': calc_result}
    analysis_result = data | {
      'cid': chemical_identifier,
      'analysis_status': 'success'
    }

    return analysis_result
  except requests.exceptions.RequestException as e:
    # 触发 Celery 自动重试（根据装饰器设置）
    raise self.retry(exc=e)
  except Exception as e:
    # 不可重试的错误
    return {
      'error': str(e),
      'chemical': chemical_identifier,
      'analysis_status': 'failed'
    }
