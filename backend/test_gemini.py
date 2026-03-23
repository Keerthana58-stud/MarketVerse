import os
from google import genai
from google.genai import types

def test_gemini():
    # Use a dummy key to verify strictly SDK parameter formatting
    client = genai.Client(api_key="dummy_1234")
    try:
        response = client.models.generate_content(
            model='gemini-2.5-flash',
            contents='test message',
            config=types.GenerateContentConfig(
                system_instruction="You are a helpful assistant.",
                temperature=0.3
            )
        )
        print("Success:", response.text)
    except Exception as e:
        print("SDK ERROR:", e)

if __name__ == '__main__':
    test_gemini()
