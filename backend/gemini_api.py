import json
import os
import google.generativeai as genai
from dotenv import load_dotenv
from vision_api import detect_text_in_image, create_vision_client, load_image

load_dotenv()

# Set up your Google API key
genai.configure(api_key=os.getenv('GEMINI_API_KEY'))

def clean_response_text(response_text):
    """
    Clean the response text by removing backticks or other unwanted characters.
    """
    cleaned_text = response_text.strip().strip("```")
    return cleaned_text

def extract_details(raw_text):
    """Extract product details from the raw text using Gemini."""
    try:
        # Set up the model
        model = genai.GenerativeModel('gemini-pro')

        # Prepare the prompt
        prompt = f"""Extract product details from the following text and format the response as a valid JSON object:

{raw_text}

Provide the information in the following format and do not include ``` in the response:
{{
  "item_name": "",
  "item_ingredients": "",
  "item_description": "",
  "item_brand": "",
  "other_details": {{}}
}}"""

        # Generate content
        response = model.generate_content(prompt)

        # Check if the response has content
        if response and hasattr(response, 'text'):
            response_text = response.text.strip()
            print(f"Raw Response Text from Gemini API: {response_text}")  # Debugging output

            # Clean the response text to remove backticks
            cleaned_text = clean_response_text(response_text)

            # Parse the cleaned response into JSON
            if cleaned_text:
                extracted_details = json.loads(cleaned_text)
                return extracted_details
            else:
                print("Gemini API returned an empty response.")
                return {}
        else:
            print("No response text received from Gemini API.")
            return {}

    except json.JSONDecodeError as json_error:
        print(f"JSON parsing error: {json_error}")
        print(f"Raw response: {response_text}")
        return {}
    except Exception as e:
        print(f"An error occurred while extracting details: {e}")
        return {}

def process_image(image_path):
    """Process the image, extract text using Vision API, and extract details."""
    try:
        # Create the Vision client
        client = create_vision_client()

        # Load the image
        image = load_image(image_path)

        # Detect text in the image
        raw_text = detect_text_in_image(client, image)
        
        if raw_text:
            print(f"Detected text from image: {raw_text}")  # Debugging output
            # Extract details using the Gemini API
            return extract_details(raw_text)
        else:
            print("No text detected in the image.")
            return {}

    except Exception as e:
        print(f"An error occurred while processing the image: {e}")
        return {}
