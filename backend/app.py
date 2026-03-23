from flask import Flask, jsonify
from flask_cors import CORS
from pymongo import MongoClient
from config import Config
from routes.auth_routes import get_auth_routes
from routes.product_routes import get_product_routes
from routes.cart_routes import get_cart_routes
from routes.order_routes import get_order_routes
import os

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "*"}})
app.config.from_object(Config)

# MongoDB connection
client = MongoClient(app.config['MONGO_URI'])
db = client.marketverse

# Ensure static folder exists for uploads
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)

# Register Blueprints
app.register_blueprint(get_auth_routes(db), url_prefix='/api/auth')
app.register_blueprint(get_product_routes(db), url_prefix='/api/products')
app.register_blueprint(get_cart_routes(db), url_prefix='/api/cart')
app.register_blueprint(get_order_routes(db), url_prefix='/api/orders')

@app.route('/', methods=['GET'])
def health_check():
    return jsonify({"message": "Welcome to MarketVerse API", "success": True}), 200

if __name__ == '__main__':
    app.run(debug=True, port=5000)
