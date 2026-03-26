from flask import Blueprint, request, jsonify
from models.cart_model import CartModel
from utils.auth_middleware import token_required, buyer_required

def get_cart_routes(db):
    cart_bp = Blueprint('cart', __name__)

    @cart_bp.route('/add', methods=['POST'])
    @token_required(db)
    @buyer_required
    def add_to_cart(current_user):
        data = request.get_json()
        if not data or not data.get('product_id'):
            return jsonify({'message': 'Missing product_id', 'success': False}), 400
        
        quantity = data.get('quantity', 1)
        CartModel.add_to_cart(db, current_user['_id'], data['product_id'], int(quantity))
        return jsonify({'message': 'Product added to cart', 'success': True}), 201

    @cart_bp.route('/', methods=['GET'])
    @token_required(db)
    @buyer_required
    def get_cart(current_user):
        cart = CartModel.get_cart(db, current_user['_id'])
        # Enrich cart with product details
        enriched_products = []
        for item in cart['products']:
            from bson import ObjectId
            product = db.products.find_one({"_id": ObjectId(item['product_id'])})
            if product:
                product['_id'] = str(product['_id'])
                product['seller_id'] = str(product['seller_id'])
                if 'created_at' in product:
                    product['created_at'] = str(product['created_at'])
                enriched_products.append({
                    'product': product,
                    'quantity': item['quantity']
                })
        
        cart['_id'] = str(cart['_id'])
        cart['products'] = enriched_products
        return jsonify({'success': True, 'cart': cart}), 200

    @cart_bp.route('/update', methods=['PUT'])
    @token_required(db)
    @buyer_required
    def update_cart(current_user):
        data = request.get_json()
        if not data or not data.get('product_id') or data.get('quantity') is None:
            return jsonify({'message': 'Missing product_id or quantity', 'success': False}), 400

        CartModel.update_cart_item(db, current_user['_id'], data['product_id'], int(data['quantity']))
        return jsonify({'message': 'Cart updated', 'success': True}), 200

    @cart_bp.route('/remove/<product_id>', methods=['DELETE'])
    @token_required(db)
    @buyer_required
    def remove_from_cart(current_user, product_id):
        CartModel.remove_from_cart(db, current_user['_id'], product_id)
        return jsonify({'message': 'Product removed from cart', 'success': True}), 200

    return cart_bp
