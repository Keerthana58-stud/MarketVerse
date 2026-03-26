import os
from dotenv import load_dotenv

# Load environment variables from .env file if it exists
load_dotenv()

class Config:
    # Use environment variables or rely on defaults
    SECRET_KEY = os.environ.get('SECRET_KEY', 'supersecretkey_marketverse')
    MONGO_URI = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    REDIS_URL = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
    UPLOAD_FOLDER = os.path.join(os.getcwd(), 'static', 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024 # 16 MB limit
    
    # Gemini Setup - strip accidental quotes when setting via Windows command line
    raw_key = os.environ.get('GEMINI_API_KEY')
    GEMINI_API_KEY = raw_key.strip(' "\'') if raw_key else None
