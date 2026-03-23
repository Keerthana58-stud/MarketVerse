import os
from flask import Blueprint, request, jsonify
from werkzeug.utils import secure_filename
from models.product_model import ProductModel
from utils.auth_middleware import token_required, seller_required
from config import Config
from bson import ObjectId

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}

def allowed_file(filename):
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_product_routes(db):
    product_bp = Blueprint('products', __name__)

    @product_bp.route('/add', methods=['POST'])
    @token_required(db)
    @seller_required
    def add_product(current_user):
        # Handle file upload
        if 'image' not in request.files:
            return jsonify({'message': 'No image provided', 'success': False}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'message': 'No selected file', 'success': False}), 400

        if not allowed_file(file.filename):
            return jsonify({'message': 'Invalid file type', 'success': False}), 400

        # Create uploads dir if it doesn't exist
        os.makedirs(Config.UPLOAD_FOLDER, exist_ok=True)
        filename = secure_filename(file.filename)
        # Add timestamp to ensure uniqueness
        from datetime import datetime
        filename = f"{datetime.now().strftime('%Y%md%H%M%S')}_{filename}"
        filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
        file.save(filepath)

        # Handle form data
        item_name = request.form.get('item_name')
        price = request.form.get('price')
        description = request.form.get('description')
        category = request.form.get('category')

        if not all([item_name, price, description, category]):
            return jsonify({'message': 'Missing product details', 'success': False}), 400

        ProductModel.create_product(
            db, 
            current_user['_id'], 
            item_name, 
            f"/static/uploads/{filename}", 
            price, 
            description, 
            category
        )

        return jsonify({'message': 'Product added successfully', 'success': True}), 201

    @product_bp.route('/all', methods=['GET'])
    def get_all_products():
        products = ProductModel.get_all_products(db)
        for p in products:
            p['_id'] = str(p['_id'])
            p['seller_id'] = str(p['seller_id'])
            if 'created_at' in p:
                p['created_at'] = str(p['created_at'])
            # fetch seller info (optional but useful)
            seller = db.users.find_one({"_id": ObjectId(p['seller_id'])})
            if seller:
                p['seller_name'] = seller.get('name')
        return jsonify({'success': True, 'products': products}), 200

    @product_bp.route('/seller', methods=['GET'])
    @token_required(db)
    @seller_required
    def get_seller_products(current_user):
        products = ProductModel.get_products_by_seller(db, current_user['_id'])
        for p in products:
            p['_id'] = str(p['_id'])
            p['seller_id'] = str(p['seller_id'])
            if 'created_at' in p:
                p['created_at'] = str(p['created_at'])
        return jsonify({'success': True, 'products': products}), 200
        
    @product_bp.route('/<id>', methods=['GET'])
    def get_product_by_id(id):
        product = ProductModel.get_product_by_id(db, id)
        if not product:
            return jsonify({'message': 'Product not found', 'success': False}), 404
        product['_id'] = str(product['_id'])
        product['seller_id'] = str(product['seller_id'])
        if 'created_at' in product:
            product['created_at'] = str(product['created_at'])
        seller = db.users.find_one({"_id": ObjectId(product['seller_id'])})
        if seller:
            product['seller_name'] = seller.get('name')
        return jsonify({'success': True, 'product': product}), 200

    @product_bp.route('/update/<id>', methods=['PUT'])
    @token_required(db)
    @seller_required
    def update_product(current_user, id):
        product = ProductModel.get_product_by_id(db, id)
        if not product or product['seller_id'] != str(current_user['_id']):
            return jsonify({'message': 'Unauthorized or Not Found', 'success': False}), 404
            
        # Get everything from either form or json
        data = request.form.to_dict() or request.get_json() or {}
        
        # Check if an image is provided in the update
        if 'image' in request.files:
            file = request.files['image']
            if file and allowed_file(file.filename):
                filename = secure_filename(file.filename)
                from datetime import datetime
                filename = f"{datetime.now().strftime('%Y%md%H%M%S')}_{filename}"
                filepath = os.path.join(Config.UPLOAD_FOLDER, filename)
                file.save(filepath)
                data['image'] = f"/static/uploads/{filename}"
                
        if 'price' in data:
            data['price'] = float(data['price'])
            
        ProductModel.update_product(db, id, current_user['_id'], data)
        return jsonify({'message': 'Product updated successfully', 'success': True}), 200

    @product_bp.route('/delete/<id>', methods=['DELETE'])
    @token_required(db)
    @seller_required
    def delete_product(current_user, id):
        result = ProductModel.delete_product(db, id, current_user['_id'])
        if result.deleted_count == 0:
            return jsonify({'message': 'Unauthorized or Not Found', 'success': False}), 404
        return jsonify({'message': 'Product deleted successfully', 'success': True}), 200

    return product_bp
