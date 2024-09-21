from bs4 import BeautifulSoup
import requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

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


if __name__ == "__main__":
    app.run(debug=True, port=5000)
