from flask import current_app
from pymongo.errors import PyMongoError

class CompoundModel:
  @property
  def collection(self):
    print(current_app.extensions)
    # 通过 current_app 动态获取连接
    db = current_app.extensions["mongo"][current_app.config["MONGO_DATABASE_NAME"]]
    return db["compound"]

  def save_compound(self, data):
    """线程安全的原子操作"""
    try:
      doc = {
        "pubchem_cid": data["pubchem_cid"],
        "meta": {
            "formula": data.get("molecular_formula"),
            "weight": data.get("molecular_weight")
        },
        "raw_data": data.get("pubchem_data")
      }

      # 使用 replace_one 实现 upsert
      result = self.collection.replace_one(
        {"pubchem_cid": doc["pubchem_cid"]},
        doc,
        upsert=True
      )
      return result.upserted_id if result.upserted_id else result.modified_count

    except Exception as e:
      print(e)
      current_app.logger.error(f"MongoDB operation failed: {str(e)}")
      import traceback
      traceback.print_exc()
      raise
