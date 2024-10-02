# ConsumeWise

[![ConsumeWise Cover](https://github.com/Priyanshu1011/ConsumeWise/raw/main/Cover%20Image/ConsumeWise.png)](https://github.com/Priyanshu1011/ConsumeWise/raw/main/Cover%20Image/ConsumeWise.png)

## About ConsumeWise

ConsumeWise is an AI-enabled smart label reader that helps consumers understand the health impact of packaged food products and nudges them to make better choices.

Check out our website: [https://consume-wise-v1.vercel.app](https://consume-wise-v1.vercel.app)

Back-end URL: [https://consumewise.onrender.com](https://consumewise.onrender.com)

## Setup for Developers

- Clone the repository

```bash
git clone https://github.com/Priyanshu1011/ConsumeWise.git
```

- Change the working directory

```bash
cd ConsumeWise/
```

### Setting up the Frontend

- Create a `.env` file similar to `.env.sample`

- Update the environment variables as instructed.

- Install the dependencies:

```bash
npm install
```

- Run the development server:

```bash
npm run dev
```

- Open [http://localhost:3000](http://localhost:3000) in your browser.

### Setting up the Backend

- Change the working directory

```bash
cd backend/
```

- Install the dependencies:

```bash
pip install -r requirements.txt
```

- Run the development server:

```bash
python app.py
```

- Endpoints to test:
  - `GET /`: To check if the server is running.
  - `POST /extract-data`: To scrape the product data from other websites.
  - `POST /analyze-food`: To generate an analysis report and healthy alternatives of the food product.
  - `POST /upload`: To extract the product data from the uploaded images.
  - `POST /get-data`: To extract the product data from images for testing purposes.

- Sample request payloads:

  - `POST /extract-data`

  ```
  {
      "website": "Flipkart",
      "url": <A Flipkart URL of a food product>,
      "productName": "",
      "productBrand": "",
      "ingredients": "",
      "description": "",
      "image": ""
  }
  ```

  - `POST /analyze-food`

  ```
  {
    "item_name": "Doritos Nacho Chips - Nacho Cheese Flavour",

    "item_brand": "Doritos",

    "item_ingredients": "Corn (77%), Edible Vegetable Oli (Palmolein), Seasoning (Milk Solids, Refined Wheat Flour, Iodised Salt, Flavour (Natural and Nature Identical Flavouring Substances), Cheese Powder, Tomato Powder, Spices & Condiments, Anticaking agent (551), Color (160c), Acidity Regulator (330)). As flavouring agent. Contains Onion and Garlic.",

    "item_description": "This is a Vegetarian product. About this item: BOLD FLAVOUR: Savory Nacho Cheese flavour that will ignite your senses. SELECT GOLDEN CORN: Made from select golden corn of the highest quality. EXTREME CRUNCH: A snack that you can not only taste but also hear. EDGY TRIANGULAR SHAPE: A nacho chip that's always on point. VERSATILE SNACK: Enjoy it by itself or with a salsa dip. SHELF LIFE: Best quality and flavour if consumed within 180 days. See more product details", 

    "language": "Hindi"
  }
  ```
