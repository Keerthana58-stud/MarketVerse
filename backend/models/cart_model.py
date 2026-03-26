from bson import ObjectId

class CartModel:
    @staticmethod
    def get_cart(db, buyer_id):
        cart = db.carts.find_one({"buyer_id": str(buyer_id)})
        if not cart:
            cart = {"buyer_id": str(buyer_id), "products": []}
            res = db.carts.insert_one(cart)
            cart['_id'] = res.inserted_id
        return cart

    @staticmethod
    def add_to_cart(db, buyer_id, product_id, quantity):
        cart = CartModel.get_cart(db, buyer_id)
        
        # Check if product is already in cart
        product_exists = False
        for item in cart['products']:
            if item['product_id'] == str(product_id):
                item['quantity'] += quantity
                product_exists = True
                break
        
        if not product_exists:
            cart['products'].append({
                "product_id": str(product_id),
                "quantity": quantity
            })
            
        return db.carts.update_one(
            {"_id": cart['_id']},
            {"$set": {"products": cart['products']}}
        )

    @staticmethod
    def update_cart_item(db, buyer_id, product_id, quantity):
        cart = CartModel.get_cart(db, buyer_id)
        for item in cart['products']:
            if item['product_id'] == str(product_id):
                item['quantity'] = quantity
                break
                
        return db.carts.update_one(
            {"_id": cart['_id']},
            {"$set": {"products": cart['products']}}
        )

    @staticmethod
    def remove_from_cart(db, buyer_id, product_id):
        cart = CartModel.get_cart(db, buyer_id)
        products = [item for item in cart['products'] if item['product_id'] != str(product_id)]
        return db.carts.update_one(
            {"_id": cart['_id']},
            {"$set": {"products": products}}
        )
