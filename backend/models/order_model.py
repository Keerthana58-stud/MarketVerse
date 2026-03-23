from datetime import datetime

class OrderModel:
    @staticmethod
    def create_order(db, buyer_id, products, total_amount, delivery_details):
        order_data = {
            "buyer_id": str(buyer_id),
            "products": products, # Needs to be heavily nested array [{product, quantity}]
            "total_amount": float(total_amount),
            "delivery_details": delivery_details,
            "order_status": "placed",
            "created_at": datetime.utcnow()
        }
        res = db.orders.insert_one(order_data)
        
        # Clear the buyer's cart after creating the order
        db.carts.update_one(
            {"buyer_id": str(buyer_id)},
            {"$set": {"products": []}}
        )
        return res
