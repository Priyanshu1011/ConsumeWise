# ConsumeWise

## About ConsumeWise

ConsumeWise is an AI-enabled smart label reader that helps consumers understand the health impact of packaged food products and nudges them to make better choices.

Check out our website: [https://consume-wise-v1.vercel.app](https://consume-wise-v1.vercel.app)

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
    - `POST /upload`: To extract the product data from the uploaded image.