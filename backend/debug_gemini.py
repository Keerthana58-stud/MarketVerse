"""
Run this script to diagnose the Gemini chatbot failure.
Usage: python debug_gemini.py
"""
import os
import sys
from dotenv import load_dotenv

load_dotenv()

api_key = os.environ.get('GEMINI_API_KEY', '')
if api_key:
    api_key = api_key.strip(' "\'')

print("=" * 50)
print("GEMINI DIAGNOSTIC SCRIPT")
print("=" * 50)

# Step 1: Check API Key
if not api_key:
    print("[FAIL] GEMINI_API_KEY is NOT set in .env file!")
    print("       Add it to MarketVerse/.env like:")
    print("       GEMINI_API_KEY=AIzaSy...")
    sys.exit(1)
else:
    print(f"[OK]   API Key found. Length={len(api_key)}, Starts: {api_key[:8]}...")

# Step 2: Check package
try:
    from google import genai
    from google.genai import types
    print("[OK]   google-genai package is installed.")
except ImportError as e:
    print(f"[FAIL] google-genai package missing: {e}")
    print("       Run: pip install google-genai")
    sys.exit(1)

# Step 3: Try to call the API
print("\nTesting Gemini API call with model 'gemini-2.0-flash'...")
try:
    client = genai.Client(api_key=api_key)
    response = client.models.generate_content(
        model='gemini-2.0-flash',
        contents='Say hello in one sentence.',
        config=types.GenerateContentConfig(temperature=0.3)
    )
    print(f"[OK]   API call successful!")
    print(f"       Response: {response.text[:150]}")
except Exception as e:
    err = str(e)
    print(f"[FAIL] API call failed: {type(e).__name__}: {err}")
    if '401' in err or 'API_KEY' in err.upper() or 'invalid' in err.lower():
        print("       CAUSE: Invalid or revoked API key.")
        print("       FIX:   Get a fresh key from https://aistudio.google.com/app/apikey")
    elif '429' in err or 'quota' in err.lower():
        print("       CAUSE: API quota/rate limit exceeded.")
        print("       FIX:   Wait or upgrade your Gemini API plan.")
    elif '404' in err or 'not found' in err.lower():
        print("       CAUSE: Model 'gemini-2.0-flash' not available for this key.")
        print("       FIX:   Try 'gemini-1.5-flash' instead.")
        print("\nRetrying with 'gemini-1.5-flash'...")
        try:
            response2 = client.models.generate_content(
                model='gemini-1.5-flash',
                contents='Say hello in one sentence.',
                config=types.GenerateContentConfig(temperature=0.3)
            )
            print(f"[OK]   'gemini-1.5-flash' works!")
            print(f"       Response: {response2.text[:150]}")
            print("\n>>> UPDATE gemini_service.py: change model to 'gemini-1.5-flash'")
        except Exception as e2:
            print(f"[FAIL] 'gemini-1.5-flash' also failed: {e2}")
    else:
        print("       CAUSE: Unknown. See full error above.")

print("=" * 50)
