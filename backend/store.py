from flask import Flask, request, jsonify
from flask_cors import CORS
from pydantic import BaseModel
from firebase_admin import credentials, firestore, initialize_app
import joblib

app = Flask(__name__)
CORS(app)

# Load model (Change 'model' file path)
model = joblib.load(r"model.pkl")

# Initialize Firestore DB (Change 'cred' file path)
cred = credentials.Certificate(r"genai-f0271-firebase-adminsdk-nismu-ff5bcc976e.json")
initialize_app(cred)
db = firestore.client()

# Define the Product model
class Product(BaseModel):
    name: str
    brand: str
    description: str
    ingredients: str

@app.route('/categorize', methods=['POST'])
def categorize_and_store():
    try:
        # Parse the incoming JSON data
        data = request.get_json()
        # print(data)
        # product = Product(**data)
        product = data
        

        # Combine description and ingredients
        combined_text = product["description"] + " " + product["ingredients"]
        
        # Predict category using the loaded model
        predicted_category = model.predict([combined_text])[0]
        
        # Create a document reference in Firestore
        doc_ref = db.collection('products').document(product["name"])
        doc = doc_ref.get()

        if not doc.exists:
            # Add new product to Firestore
            doc_ref.set({
                'name': product.name,
                'brand': product.brand,
                'description': product.description,
                'ingredients': product.ingredients,
                'category': predicted_category
            })
            return jsonify({"message": f"Added new product: {product.name} with category {predicted_category}"})
        else:
            return jsonify({"message": f"Product {product.name} already exists."})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/products', methods=['GET'])
def get_all_products():
    try:
        products = db.collection('products').stream()
        all_products = [product.to_dict() for product in products]
        return jsonify(all_products)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == "__main__":
    app.run(debug=True, port=5002)
