import os

class Config:
    # Use environment variables or rely on defaults
    SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey_marketverse')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 # 16 MB limit
