from flask import Flask, request, jsonify
from flask_cors import CORS
from fpdf import FPDF
import requests
import re
import os
from datetime import datetime
from google.generativeai import configure, GenerativeModel

app = Flask(__name__)
CORS(app)

# Set up Google Gemini API
GOOGLE_API_KEY = ""  # Ensure the key is set in your environment
if not GOOGLE_API_KEY:
    raise Exception("Google API Key is missing. Please set the GOOGLE_API_KEY environment variable.")

configure(api_key=GOOGLE_API_KEY)
modelAI = GenerativeModel('gemini-pro')


class FoodItemRequest:
    def __init__(self, name, ingredients, description, brand):
        self.name = name
        self.ingredients = ingredients
        self.description = description
        self.brand = brand


class PDFReport(FPDF):
    def header(self):
        self.set_font('Arial', 'B', 12)
        self.cell(0, 10, 'Food Item Report', 0, 1, 'C')

    def footer(self):
        self.set_y(-15)
        self.set_font('Arial', 'I', 8)
        self.cell(0, 10, f'Page {self.page_no()}', 0, 0, 'C')

    def add_report(self, report_text):
        self.add_page()
        self.set_left_margin(10)
        self.set_right_margin(10)
        self.set_font('Arial', '', 12)
        for line in report_text.split('\n'):
            self.multi_cell(0, 10, line)


def analyze_food_with_gemini(food_item):
    try:
        # API call to Gemini (mocked for now, replace with real call)
        prompt = f"""
            Analyze the following food item:
            Name: {food_item.name}
            Ingredients: {food_item.ingredients}
            Description: {food_item.description}
            Brand: {food_item.brand}
            Compare the description with the actual ingredients and provide a report on its health impact, quality, and whether the food item matches the description.
        """
        
        response = modelAI.generate_content(prompt)
        analysis_report = response.parts[0].text
        
        # Clean the report
        formatted_report = re.sub(r'\(.*?\)', '', analysis_report)
        formatted_report = re.sub(r'\n\s*\*\s', '\n', formatted_report)

        return formatted_report

    except Exception as e:
        raise Exception(f"Error analyzing food item: {str(e)}")


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
        # Analyze the food item using Gemini API
        analysis_report = analyze_food_with_gemini(food_item)

        # Generate a PDF Report
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        pdf_filename = f"Food_Item_Report_{timestamp}.pdf"
        
        pdf = PDFReport()
        pdf.add_report(analysis_report)
        pdf.output(pdf_filename)

        return jsonify({
            "message": "Food item analysis successful",
            "report": analysis_report,
            "pdf_filename": pdf_filename
        })
    except Exception as e:
        return jsonify({"error": str(e)}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5001)
