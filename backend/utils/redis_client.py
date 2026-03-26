import json
import logging
from redis import Redis, ConnectionError
from config import Config

logger = logging.getLogger(__name__)

class RedisCache:
    def __init__(self):
        self.client = None
        self.connected = False
        self.init_app()

    def init_app(self):
        """Initialize the Redis client."""
        try:
            self.client = Redis.from_url(Config.REDIS_URL, decode_responses=True)
            # Ping to verify connection
            self.client.ping()
            self.connected = True
            logger.info("Successfully connected to Redis for caching.")
        except ConnectionError as e:
            self.connected = False
            logger.warning(f"Failed to connect to Redis at {Config.REDIS_URL}. Caching will be bypassed. Error: {e}")
        except Exception as e:
             self.connected = False
             logger.error(f"Unexpected error validating Redis: {e}")

    def get(self, key):
        """Get a value from cache gracefully."""
        if not self.connected or not self.client:
            return None
        try:
            val = self.client.get(key)
            if val:
                return json.loads(val)
        except Exception as e:
            logger.error(f"Redis GET error for key '{key}': {e}")
        return None

    def set(self, key, value, ex=3600):
        """Set a value in cache gracefully with default expiration of 1 hour."""
        if not self.connected or not self.client:
            return False
        try:
            self.client.set(key, json.dumps(value), ex=ex)
            return True
        except Exception as e:
            logger.error(f"Redis SET error for key '{key}': {e}")
        return False

    def delete(self, *keys):
        """Delete keys from cache gracefully."""
        if not self.connected or not self.client:
            return False
        try:
            if keys:
                self.client.delete(*keys)
                return True
        except Exception as e:
            logger.error(f"Redis DELETE error for keys '{keys}': {e}")
        return False
        
    def delete_pattern(self, pattern):
        """Delete keys matching a pattern gently using scan."""
        if not self.connected or not self.client:
            return False
        try:
            for key in self.client.scan_iter(pattern):
                self.client.delete(key)
            return True
        except Exception as e:
            logger.error(f"Redis DELETE PATTERN error for '{pattern}': {e}")
        return False

# Create a singleton instance
redis_cache = RedisCache()
