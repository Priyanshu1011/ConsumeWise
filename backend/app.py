from bs4 import BeautifulSoup
import requests
from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
from pydantic import BaseModel
import re
from google.generativeai import configure, GenerativeModel
import google.generativeai as genai
import os

from werkzeug.utils import secure_filename
import gemini_api

app = Flask(__name__)
CORS(app)


# Configure upload folder and allowed file extensions
UPLOAD_FOLDER = 'uploads/'
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER

# Ensure the upload folder exists
if not os.path.exists(UPLOAD_FOLDER):
    os.makedirs(UPLOAD_FOLDER)

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

@app.route('/')
def index():
    return render_template('index.html')

# Setting up the Google Gemini API
GOOGLE_API_KEY = os.environ.get('GOOGLE_API_KEY')
if not GOOGLE_API_KEY:
    raise Exception("Google API Key is missing. Please set the GOOGLE_API_KEY environment variable.")
configure(api_key=GOOGLE_API_KEY)

# Initializing the Generative Model
modelAI = GenerativeModel('gemini-pro')

class FoodItemRequest(BaseModel):
    name: str
    brand: str
    description: str
    ingredients: str

# Set headers to mimic a browser request
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
}

# Amazon scraper function
def amazon_scraper(url):
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        html_text = response.text
        soup = BeautifulSoup(html_text, 'lxml')

        product_name = soup.find('span', {'id': 'productTitle'}).get_text(strip=True)
        brand_name = soup.find('a', {'id': 'bylineInfo'}).get_text(strip=True)
        
        ingredients_section = soup.find('div', {'id': 'important-information'})
        ingredients = ingredients_section.find('div', class_='a-section content').get_text(strip=True) if ingredients_section else 'Ingredients not found'
        ingredients = ingredients[ingredients.find('Ingredients') + len('Ingredients:'):] if 'Ingredients' in ingredients else ingredients

        about_section = soup.find('div', {'id': 'feature-bullets'})
        about_product = about_section.get_text(strip=True) if about_section else 'Details not found'
        
        return {
            "food_item_name": product_name,
            "food_item_brand": brand_name,
            "food_item_ingredients": ingredients,
            "food_item_description": about_product
        }
    else:
        return {"error": f"Failed to retrieve the page. Status code: {response.status_code}"}

# Flipkart scraper function
def flipkart_scraper(url):
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        html_text = response.text
        soup = BeautifulSoup(html_text, 'lxml')

        # Product name
        product_name = None
        product_name = soup.find('span', {'class': 'VU-ZEz'})
        if product_name:
            product_name = product_name.get_text(strip=True)
        
        brand_name, general_section, ingredients = None, None, None
        general_section = soup.find('div', {'class': 'GNDEQ-'}).find_next_sibling()
        if general_section:
            # Brand name
            brand_name = general_section.find('li', class_ = 'HPETK2')
            # Ingredients
            ingredients = general_section.find('tr', class_ = 'WJdYP6 row').find_next_sibling().find_next_sibling().find_next_sibling().find_next_sibling().find_next_sibling().find_next_sibling().find('li', class_ = 'HPETK2')

            if brand_name:
                brand_name = brand_name.get_text(strip=True)
            
            if ingredients:
                ingredients = ingredients.get_text(strip=True)

        # About the product
        about_product = None
        about_section = soup.find('div', {'class': 'DOjaWF gdgoEp col-8-12'})
        if about_section:
            about_section = about_section.find('div', {'class': 'DOjaWF gdgoEp'})
            if about_section:
                about_section = about_section.find('div', {'class': 'DOjaWF YJG4Cf'})
                if about_section:
                    about_section = about_section.find_next_sibling()
                    if about_section:
                        about_section = about_section.find('div', {'class': '_4gvKMe'})
                        if about_section:
                            about_section = about_section.find('div', {'class': 'yN+eNk'})
                            about_product = about_section.get_text(strip=True)
        
        # Print the extracted information
        return {
            "food_item_name": product_name,
            "food_item_brand": brand_name,
            "food_item_ingredients": ingredients,
            "food_item_description": about_product
        }
    else:
        print(f"Failed to retrieve the page. Status code: {response.status_code}")

# Generates the food analysis report
def analyze_food_with_gemini(food_item):
    try:
        prompt = f"""
            Analyze the following food item in a structured format with clear section headings:
            
            Name: {food_item.name}
            Ingredients: {food_item.ingredients}
            Description: {food_item.description}
            Brand: {food_item.brand}
            
            Please provide the analysis with the following sections:

            1. Health Impact: Discuss the potential health effects of consuming this food item, highlighting the positive and negative aspects of its ingredients.
            2. Quality: Evaluate the quality of the ingredients used, taking into consideration any additives or preservatives.
            3. Description Match: Analyze whether the product description matches the actual ingredients and explain any discrepancies, if present.
            
            Ensure the response uses HTML tags such as <h3> for headings and <p> for paragraphs.
        """
        
        response = modelAI.generate_content(prompt)
        analysis_report = response.parts[0].text
        
        formatted_report = re.sub(r'\(.*?\)', '', analysis_report)  # Removing extra parentheses
        formatted_report = re.sub(r'\n\s*\*\s', '\n', formatted_report)

        return formatted_report

    except Exception as e:
        raise Exception(f"Error analyzing food item: {str(e)}")

# Generates healthier alternatives
def suggest_healthy_alternatives(food_item):
    try:
        prompt = f"""
            Suggest healthy alternatives for the following food item:
            
            Name: {food_item.name}
            Ingredients: {food_item.ingredients}
            Description: {food_item.description}
            Brand: {food_item.brand}
            
            Provide a list of 3-5 healthier alternatives with product brand, along with a brief explanation of why they are healthier.
            Ensure the response uses HTML tags such as <h3> for headings and <p> for paragraphs.
        """
        
        response = modelAI.generate_content(prompt)
        alternatives_report = response.parts[0].text
        
        return alternatives_report

    except Exception as e:
        raise Exception(f"Error suggesting alternatives: {str(e)}")


@app.route('/analyze-food', methods=['POST'])
def analyze_food():
    data = request.get_json()

    food_item_name = data.get('food_item_name')
    food_item_ingredients = data.get('food_item_ingredients')
    food_item_description = data.get('food_item_description')
    food_item_brand = data.get('food_item_brand')

    if not all([food_item_name, food_item_ingredients, food_item_description, food_item_brand]):
        return jsonify({"error": "Missing required food item information"}), 400

    # Create a FoodItemRequest object
    food_item = FoodItemRequest(
        name=food_item_name,
        ingredients=food_item_ingredients,
        description=food_item_description,
        brand=food_item_brand
    )

    try:
        html_analysis = analyze_food_with_gemini(food_item)
        alternatives = suggest_healthy_alternatives(food_item)

        return jsonify({
            "message": "Food item analysis successful",
            "html_analysis": html_analysis,
            "healthy_alternatives": alternatives
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500
    
@app.route('/extract-data', methods=['POST'])
def scrape():
    data = request.json
    url = data.get('url')
    website = data.get('website').lower()

    if website == 'amazon':
        result = amazon_scraper(url)
    elif website == 'flipkart':
        result = flipkart_scraper(url)
    else:
        result = {"error": "Unsupported website. Please use 'Amazon' or 'Flipkart'."}

    return result

@app.route('/upload', methods=['POST'])
def upload_file():
    if 'file' not in request.files:
        return jsonify({"error": "No file part"}), 400

    file = request.files['file']
    
    if file.filename == '':
        return jsonify({"error": "No selected file"}), 400

    if file and allowed_file(file.filename):
        filename = secure_filename(file.filename)
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filename)
        file.save(file_path)
        
        # Extract details using Gemini API via gemini_api.py
        extracted_details = gemini_api.process_image(file_path)
        
        return jsonify(extracted_details)

    return jsonify({"error": "File type not allowed"}), 400

# Endpoint to check if the server is running
@app.route('/', methods=['GET'])
def read_root():
    return {"message": "Product Analysis API"}


if __name__ == "__main__":
    app.run(debug=True, port=5000)