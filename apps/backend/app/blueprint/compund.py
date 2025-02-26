from flask import Blueprint, request
import app.services.pubchem_client as pubchem_client

compund_bp = Blueprint("compund", __name__, url_prefix="/compund")

@compund_bp.route("/query", methods=["GET"])
def fetch():
  cid = request.args.get("cid")
  print(cid)
  return pubchem_client.fetch_compound(cid) 