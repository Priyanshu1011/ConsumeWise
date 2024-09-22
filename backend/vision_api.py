import os
import io
from google.cloud import vision
from google.cloud.vision_v1 import ImageAnnotatorClient

def set_google_credentials(credentials_path):
    """Set the environment variable for Google Cloud credentials."""
    if not os.path.exists(credentials_path):
        raise FileNotFoundError(f"Credentials file not found: {credentials_path}")
    os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = credentials_path
    print("Google Cloud credentials set successfully")

def create_vision_client():
    """Create and return a Google Cloud Vision client."""
    try:
        client = ImageAnnotatorClient()
        print("Vision client created successfully")
        return client
    except Exception as e:
        raise RuntimeError(f"Error creating Vision client: {e}")

def load_image(image_path):
    """Load and return the content of an image file."""
    if not os.path.exists(image_path):
        raise FileNotFoundError(f"Image file not found: {image_path}")

    with io.open(image_path, 'rb') as image_file:
        content = image_file.read()
    print("Image loaded successfully")
    return vision.Image(content=content)

def detect_text_in_image(client, image):
    """Perform text detection on the provided image and return the detected text."""
    try:
        response = client.text_detection(image=image)
        print("Response received")

        if response.error.message:
            raise RuntimeError(f"{response.error.message}\nFor more info on error messages, check: "
                               "https://cloud.google.com/apis/design/errors")

        if response.text_annotations:
            return response.text_annotations[0].description
        else:
            return "No text detected in the image"
    except Exception as e:
        raise RuntimeError(f"An error occurred during text detection: {e}")
