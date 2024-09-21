"use client";
import unhealthyKeywords from "@/utils/constants";
import { useState } from "react";
// import { useRouter } from "next/navigation";

const InputForm = () => {
  const [inputType, setInputType] = useState("");
  const [formData, setFormData] = useState({
    website: "",
    url: "",
    productName: "",
    productBrand: "",
    ingredients: "",
    description: "",
    image: "",
  });

  const [isValid, setIsValid] = useState(false);
  const [responseData, setResponseData] = useState(null); // response from /extract-data
  const [finalAnalysis, setFinalAnalysis] = useState(null); // response from /analyze-food
  const [alternativesResult, setAlternativesResult] = useState(null);
  //   const router = useRouter();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateForm();
  };

  const handleImageUpload = (e) => {
    setFormData({
      ...formData,
      image: e.target.files[0],
    });
    validateForm();
  };

  const validateForm = () => {
    if (inputType === "Website URL") {
      setIsValid(formData.website !== "" && formData.url !== "");
    } else if (inputType === "Manual Input") {
      const { productName, productBrand, ingredients, description } = formData;
      setIsValid(
        formData.website !== "" &&
          productName &&
          productBrand &&
          ingredients &&
          description
      );
    } else if (inputType === "Image Upload") {
      setIsValid(formData.image != null && formData.website !== "");
    }
  };

  function checkIsUnhealthy(analysisObject) {
    const content = analysisObject.report;
    const lowercasedContent = content.toLowerCase();

    // Check if any unhealthy keywords exist in the description
    for (const keyword of unhealthyKeywords) {
      if (lowercasedContent.includes(keyword)) {
        return true; // Unhealthy food detected
      }
    }
    return false; // No unhealthy indicators found
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isValid) {
      if (inputType === "Website URL") {
        try {
          const response = await fetch("http://localhost:5000/extract-data", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
          });

          if (response.ok) {
            console.log("Successfully received a response from /extract-data");
            const result = await response.json();
            setResponseData(result);
            // console.log("responseData: " + responseData);

            const analysisResponse = await fetch(
              "http://localhost:5001/analyze-food",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(result),
              }
            );

            const categorizeObj = {
              name: result.food_item_name,
              ingredients: result.food_item_ingredients,
              description: result.food_item_description,
              brand: result.food_item_brand,
            };
            const categorizeResponse = await fetch(
              "http://localhost:5002/categorize",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify(categorizeObj),
              }
            );

            if (analysisResponse.ok) {
              console.log(
                "Successfully received a response from /analyze-food"
              );
              const analysisResult = await analysisResponse.json();
              setFinalAnalysis(analysisResult);
              // console.log("finalAnalysis: " + finalAnalysis);
              // router.push("/results");
              const isUnhealthy = checkIsUnhealthy(analysisResult);
              if (isUnhealthy) {
                const alternativesResponse = await fetch(
                  "http://localhost:5003/analyze_product",
                  {
                    method: "POST",
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify(result),
                  }
                );
                if (alternativesResponse.ok) {
                  console.log(
                    "Successfully received a response from /analyze_product"
                  );
                  const alternatives = await alternativesResponse.json();
                  setAlternativesResult(alternatives);
                  // console.log("alternativesResult: " + alternativesResult);
                } else {
                  console.error("Failed to fetch data from /analyze_product");
                }
              }
            } else {
              console.error("Failed to fetch data from /analyze-food");
            }
          } else {
            console.error("Failed to fetch data from /extract-data");
          }
        } catch (error) {
          console.error("Error:", error);
        }
      } else if (inputType === "Manual Input") {
        formDataToSend.append("food_item_name", formData.productName);
        formDataToSend.append("food_item_brand", formData.productBrand);
        formDataToSend.append("food_item_ingredients", formData.ingredients);
        formDataToSend.append("food_item_description", formData.description);
        // Send request to /analyze-food => alternatives

        try {
          const analysisResponse = await fetch(
            "http://localhost:5001/analyze-food",
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: formDataToSend,
            }
          );

          if (analysisResponse.ok) {
            console.log("Successfully received a response from /analyze-food");
            const analysisResult = await analysisResponse.json();
            setFinalAnalysis(analysisResult);
            // router.push("/results");
            const isUnhealthy = checkIsUnhealthy(analysisResult);
            if (isUnhealthy) {
              const alternativesResponse = await fetch(
                "http://localhost:5003/analyze_product",
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                  },
                  body: formDataToSend,
                }
              );
              if (alternativesResponse.ok) {
                console.log(
                  "Successfully received a response from /analyze_product"
                );
                const alternatives = await alternativesResponse.json();
                setAlternativesResult(alternatives);
              } else {
                console.error("Failed to fetch data from /analyze_product");
              }
            }
          } else {
            console.error("Failed to fetch data from /analyze-food");
          }
        } catch (error) {
          console.error("Error: ", error);
        }
      } else if (inputType === "Image Upload") {
        formDataToSend.append("image", formData.image);
        // Send request to /image-ocr-extraction => /analyze-food => alternatives
      }
    } else {
      alert(
        "Please fill out either Website URL, Ingredients, or upload an image."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-4 text-blue-800">
      {/* <form
        onSubmit={handleSubmit}
        className="bg-blue-200 p-6 rounded-lg shadow-md"
      >
        <div className="mb-4">
          <label className="block font-semibold mb-2">Website</label>
          <select
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Select the website in which the packaged product is present"
          >
            <option value="">Select a website</option>
            <option value="Amazon">Amazon</option>
            <option value="Flipkart">Flipkart</option>
            <option value="Bigbasket">Bigbasket</option>
            <option value="Jiomart">Jiomart</option>
          </select>
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Website URL</label>
          <input
            type="text"
            name="url"
            value={formData.url}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the website URL"
            autoComplete="off"
            title="Enter the website URL of the packaged product"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Ingredients</label>
          <textarea
            name="ingredients"
            value={formData.ingredients}
            onChange={handleInputChange}
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter the ingredients"
            rows="4"
            title="Enter the ingredients of the packaged product"
          />
        </div>

        <div className="mb-4">
          <label className="block font-semibold mb-2">Image Upload</label>
          <input
            type="file"
            name="image"
            accept="image/*"
            onChange={handleImageUpload}
            className="w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Upload an image of the packaged product"
          />
        </div>

        <button
          type="submit"
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            isValid ? "" : "opacity-50 cursor-not-allowed"
          }`}
          disabled={!isValid}
        >
          Submit
        </button>
      </form> */}

      <form
        onSubmit={handleSubmit}
        className="bg-blue-200 w-[90%] md:w-[60%] lg:w-[33%] p-6 lg:p-10 rounded-lg shadow-md"
      >
        {/* Selecting the website */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Website</label>
          <select
            name="website"
            value={formData.website}
            onChange={handleInputChange}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Select the website in which the packaged product is present"
          >
            <option value="">Select a website</option>
            <option value="Amazon">Amazon</option>
            <option value="Flipkart">Flipkart</option>
            <option value="Bigbasket">Bigbasket</option>
            <option value="Jiomart">Jiomart</option>
          </select>
        </div>

        {/* Dropdown to choose input type */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Select Input Type</label>
          <select
            value={inputType}
            onChange={(e) => {
              setInputType(e.target.value);
              setIsValid(false); // Reset form validation when changing input type
            }}
            required
            className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select an option</option>
            <option value="Website URL">Website URL</option>
            <option value="Manual Input">Manual Input</option>
            <option value="Image Upload">Image Upload</option>
          </select>
        </div>

        {/* Conditional inputs based on selection */}
        {inputType === "Website URL" && (
          <div className="mb-4">
            <label className="block font-medium mb-2">Website URL</label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter the website URL"
              required
              autoComplete="off"
              title="Enter the website URL of the packaged product"
            />
          </div>
        )}

        {inputType === "Manual Input" && (
          <>
            <div className="mb-4">
              <label className="block font-medium mb-2">Product Name</label>
              <input
                type="text"
                name="productName"
                value={formData.productName}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the product name"
                title="Enter the name of the packaged product"
                required
                autoComplete="off"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-2">Product Brand</label>
              <input
                type="text"
                name="productBrand"
                value={formData.productBrand}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the product brand"
                title="Enter the brand of the packaged product"
                required
                autoComplete="off"
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-2">Ingredients</label>
              <textarea
                name="ingredients"
                value={formData.ingredients}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the ingredients"
                title="Enter the ingredients of the packaged product"
                rows="4"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block font-medium mb-2">Description</label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter the product description"
                title="Enter the description of the packaged product"
                rows="4"
                required
              />
            </div>
          </>
        )}

        {inputType === "Image Upload" && (
          <div className="mb-4">
            <label className="block font-medium mb-2">Image Upload</label>
            <input
              type="file"
              name="image"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              title="Upload an image of the packaged product"
            />
          </div>
        )}

        {/* Submit button appears only when a valid option is selected */}
        {/* {isValid && (
          <button
            type="submit"
            className="w-full bg-blue-500 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Submit
          </button>
        )} */}
        <button
          type="submit"
          className={`w-full bg-blue-500 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600 ${
            isValid ? "" : "opacity-50 cursor-not-allowed"
          }`}
          disabled={!isValid}
        >
          Submit
        </button>
      </form>

      {/* Display the response from /extract-data */}
      {responseData && (
        <div className="mt-6 p-8 bg-blue-100 rounded-lg">
          <h3 className="text-xl text-center font-bold mb-3">
            Product Details
          </h3>
          <p>
            <strong>Product Name: </strong> {responseData.food_item_name}
          </p>
          <p>
            <strong>Brand: </strong> {responseData.food_item_brand}
          </p>
          <p>
            <strong>Ingredients: </strong> {responseData.food_item_ingredients}
          </p>
          <p>
            <strong>Description: </strong> {responseData.food_item_description}
          </p>
        </div>
      )}

      {/* Display the final analysis from /analyze-food */}
      {finalAnalysis && (
        <div className="mt-6 p-8 bg-blue-100 rounded-lg flex flex-col items-center">
          <h3 className="text-xl text-center font-bold mb-3">
            Product Analysis
          </h3>
          {/* <p>
            <strong>Message: </strong> {finalAnalysis.message}
          </p> */}
          {/* <p>
            <strong>PDF Filename: </strong> {finalAnalysis.pdf_filename}
          </p> */}
          <p>
            {/* <strong>Report: </strong> */}
            {finalAnalysis.report}
          </p>
          {/* <button className="bg-green-500 text-white w-[250px] py-2 px-4 rounded-md mt-4 focus:outline-none focus:ring-2 focus:ring-green-600">
            <a href="" download>
              Download as PDF
            </a>
          </button> */}
        </div>
      )}

      {/* Display the alternatives from /analyze_product */}
      {alternativesResult && (
        <div className="mt-6 p-8 bg-blue-100 rounded-lg">
          <h3 className="text-xl text-center font-bold mb-3">Alternatives</h3>
          <p>
            <strong>genai_alternatives: </strong>{" "}
            {alternativesResult.genai_alternatives}
          </p>
          <p>
            <strong>db_alternatives: </strong>{" "}
            {alternativesResult.db_alternatives}
          </p>
        </div>
      )}
    </div>
  );
};

export default InputForm;
