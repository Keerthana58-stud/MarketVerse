from datetime import datetime
from bson import ObjectId

class OrderModel:
    @staticmethod
    def create_order(db, buyer_id, buyer_name, buyer_email, products_req, delivery_details):
        # products_req is list of {product_id, quantity}
        processed_products = []
        total_amount = 0.0
        
        # 1. Validate stock and build processed_products
        for req_item in products_req:
            prod_id = req_item.get('product_id')
            qty = int(req_item.get('quantity', 1))
            
            # Fetch product from DB to verify price, stock, and get seller_id
            product_db = db.products.find_one({"_id": ObjectId(prod_id)})
            if not product_db:
                raise ValueError(f"Product not found: {prod_id}")
                
            current_stock = int(product_db.get('stock', 0))
            if current_stock < qty:
                raise ValueError(f"Insufficient stock for {product_db.get('item_name')}. Available: {current_stock}")
                
            item_price = float(product_db.get('price', 0.0))
            total_amount += (item_price * qty)
            
            processed_products.append({
                "product_id": str(prod_id),
                "seller_id": str(product_db.get('seller_id')),
                "item_name": product_db.get('item_name'),
                "image": product_db.get('image'),
                "price": item_price,
                "quantity": qty
            })
            
        # 2. Deduct stock for all validated products
        for item in processed_products:
            db.products.update_one(
                {"_id": ObjectId(item['product_id'])},
                {"$inc": {"stock": -item['quantity']}}
            )

        # 3. Create the order document
        order_data = {
            "buyer_id": str(buyer_id),
            "buyer_name": buyer_name,
            "buyer_email": buyer_email,
            "products": processed_products,
            "total_amount": total_amount,
            "delivery_details": delivery_details,
            "order_status": "placed",
            "payment_status": "Paid", # Simulated
            "created_at": datetime.utcnow()
        }
        res = db.orders.insert_one(order_data)
        
        # 4. Clear the buyer's cart
        db.carts.update_one(
            {"buyer_id": str(buyer_id)},
            {"$set": {"products": []}}
        )
        return res

    @staticmethod
    def get_orders_by_buyer(db, buyer_id):
        orders = list(db.orders.find({"buyer_id": str(buyer_id)}).sort("created_at", -1))
        for o in orders:
            o['_id'] = str(o['_id'])
            if 'created_at' in o: o['created_at'] = str(o['created_at'])
        return orders

    @staticmethod
    def get_orders_by_seller(db, seller_id):
        # Find all orders where at least one product has this seller_id
        # Then we format the order to only show products relevant to THIS seller
        seller_id_str = str(seller_id)
        all_relevant_orders = list(db.orders.find({"products.seller_id": seller_id_str}).sort("created_at", -1))
        
        seller_orders = []
        for order in all_relevant_orders:
            # Filter products within the order for this specific seller
            seller_products = [p for p in order['products'] if p.get('seller_id') == seller_id_str]
            if not seller_products:
                continue
                
            # Calculate total amount specifically paid to THIS seller for this order
            seller_total = sum(p['price'] * p['quantity'] for p in seller_products)
            
            formatted_order = {
                "_id": str(order['_id']),
                "buyer_name": order.get('buyer_name', 'Unknown'),
                "buyer_email": order.get('buyer_email', 'No Email'),
                "products": seller_products,
                "total_amount": seller_total,
                "order_status": order.get('order_status'),
                "payment_status": order.get('payment_status'),
                "delivery_details": order.get('delivery_details'),
                "created_at": str(order.get('created_at'))
            }
            seller_orders.append(formatted_order)
            
        return seller_orders
