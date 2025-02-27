import re
from flask import Blueprint, request, jsonify
from celery.result import AsyncResult

import app.services.pubchem_client as pubchem_client
from app.tasks.compund_tasks import add_together
from app.tasks.compund_tasks import chem_analysis

compund_bp = Blueprint("compund", __name__, url_prefix="/compund")

@compund_bp.route("/query", methods=["GET"])
def fetch():
  cid = request.args.get("cid")
  print(cid)
  return pubchem_client.fetch_compound(cid)

@compund_bp.route("/start-analysis", methods=["POST"])
def analysis():
  chemical = request.json.get('chemical', '').strip()

  if not chemical:
    return jsonify({'error': 'Missing chemical identifier'}), 400

  # 进一步验证格式（如CID是否为数字）
  if not chemical.isdigit() and not re.match(r'^[a-zA-Z0-9\s-]+$', chemical):
    return jsonify({'error': 'Invalid chemical identifier'}), 400

  # 启动异步任务
  task = chem_analysis.delay(chemical)

  return jsonify({"task_id": task.id}), 202


@compund_bp.route("/add", methods=["POST"])
def start_add() -> dict[str, object]:
  a = request.form.get("a", type=int)
  b = request.form.get("b", type=int)

  result = add_together.delay(a, b)

  return {"result_id": result.id}

@compund_bp.get('/task-status/<task_id>')
def get_task_status(task_id):
  task = AsyncResult(task_id)

  return jsonify({
    "task_id": task.id,
    "status": task.status,
    "result": task.result if task.ready() else None
  })
