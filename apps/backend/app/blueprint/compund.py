from flask import Blueprint, request, jsonify
import app.services.pubchem_client as pubchem_client

compund_bp = Blueprint("compund", __name__, url_prefix="/compund")

@compund_bp.route("/query", methods=["GET"])
def fetch():
  cid = request.args.get("cid")
  print(cid)
  return pubchem_client.fetch_compound(cid)

@compund_bp.route("/start-analysis", methods=["POST"])
def analysis():
  try:
    cid = int(request.json.get("cid"))

    if cid <= 0:
      raise ValueError("CID must be a positive integer.")
  except:
    return jsonify({"error": "无效的CID格式"}), 400

  print(cid)
  return pubchem_client.fetch_compound(cid)
