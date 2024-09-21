from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import firebase_admin
from firebase_admin import credentials, firestore
import google.generativeai as genai
import re
import uvicorn

from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
# app = FastAPI()
CORS(app)

cred = credentials.Certificate(r"genai-f0271-firebase-adminsdk-nismu-ff5bcc976e.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

GOOGLE_API_KEY = ''
genai.configure(api_key=GOOGLE_API_KEY)
modelAI = genai.GenerativeModel('gemini-pro')

class Product(BaseModel):
    name: str
    description: str
    category: str
    brand: str

def find_alternatives_using_genai(description: str, category: str) -> str:
    prompt = f"""
    Suggest healthy alternatives for a product with the following description: {description}. 
    The product falls under the category {category}. Provide 3 healthier alternatives that are commonly available.
    """
    response = modelAI.generate_content(prompt)
    api_output = response.parts[0].text
    formatted_text = re.sub(r'\(.*?\)', '', api_output)
    formatted_text = re.sub(r'\n\s*\*\s', '\n', formatted_text).strip()
    
    return formatted_text

def find_alternatives_in_firestore(category: str):
    # Query Firestore for healthy alternatives in the given category
    try:
        collection_ref = db.collection('products')
        query_ref = collection_ref.where('category', '==', category).where('health_label', '==', 'Healthy').stream()
        
        alternatives = [doc.to_dict() for doc in query_ref]
        
        return alternatives
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'Error querying Firestore: {str(e)}')

# @app.post("/analyze_product")
@app.route('/analyze_product', methods=['POST'])
async def analyze_product(product: Product):
    # Check the health label of the product
    try:
        product_ref = db.collection('products').where('name', '==', product.name).stream()
        product_data = None
        for doc in product_ref:
            product_data = doc.to_dict()
        
        if not product_data:
            raise HTTPException(status_code=404, detail="Product not found!")
        
        health_label = product_data['health_label']
        
        response_data = {
            "product_name": product.name,
            "health_label": health_label
        }

        if health_label in ["Unhealthy", "Slightly Unhealthy"]:
            # Generate healthy alternatives using Gemini Pro
            alternatives = find_alternatives_using_genai(product.description, product.category)
            
            # Check Firestore for existing alternatives
            category_alternatives = find_alternatives_in_firestore(product.category)
            
            response_data.update({
                "genai_alternatives": alternatives,
                "db_alternatives": [alt['name'] for alt in category_alternatives]
            })
        else:
            response_data["message"] = "The product is considered healthy."
        
        return response_data
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(status_code=500, detail=f'An error occurred: {str(e)}')

# @app.get("/")
@app.route('/', methods=['GET'])
def read_root():
    return {"message": "Product Analysis API"}

if __name__ == "__main__":
    # uvicorn.run(app, host="127.0.0.1", port=5003)
    app.run(debug=True, port=5003)
