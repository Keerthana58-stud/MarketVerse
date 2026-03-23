from datetime import datetime
from bson import ObjectId

class ProductModel:
    @staticmethod
    def create_product(db, seller_id, item_name, image_path, price, description, category):
        product_data = {
            "seller_id": str(seller_id),
            "item_name": item_name,
            "image": image_path,
            "price": float(price),
            "description": description,
            "category": category,
            "created_at": datetime.utcnow()
        }
        return db.products.insert_one(product_data)

    @staticmethod
    def get_all_products(db):
        return list(db.products.find())

    @staticmethod
    def get_products_by_seller(db, seller_id):
        return list(db.products.find({"seller_id": str(seller_id)}))

    @staticmethod
    def get_product_by_id(db, product_id):
        return db.products.find_one({"_id": ObjectId(product_id)})

    @staticmethod
    def update_product(db, product_id, seller_id, update_data):
        return db.products.update_one(
            {"_id": ObjectId(product_id), "seller_id": str(seller_id)},
            {"$set": update_data}
        )

    @staticmethod
    def delete_product(db, product_id, seller_id):
        return db.products.delete_one({"_id": ObjectId(product_id), "seller_id": str(seller_id)})
