"use client";
import { useState, useRef } from "react";
import Loader from "./Loader";

const InputForm = () => {
  const backendRootURL = process.env.NEXT_PUBLIC_BACKEND_ROOT_URL;
  const scraperEndpoint = backendRootURL + "/extract-data";
  const analyzeFoodEndpoint = backendRootURL + "/analyze-food";
  const testDataEndpoint = backendRootURL + "/get-data";
  const imageOCREndpoint = backendRootURL + "/upload";

  const [inputType, setInputType] = useState("");
  const [formData, setFormData] = useState({
    website: "",
    url: "",
    productName: "",
    productBrand: "",
    ingredients: "",
    description: "",
    image: "",
    language: "",
  });
  const [isValid, setIsValid] = useState(false); // If the form inputs submitted are valid or not
  const [isFormSubmitted, setIsFormSubmitted] = useState(false); // If form has been submitted
  const [responseData, setResponseData] = useState(null); // response from /extract-data
  const [finalAnalysis, setFinalAnalysis] = useState(null);
  const [alternatives, setAlternatives] = useState(null);
  const [showModal, setShowModal] = useState(false); // Should the error modal popup be shown
  const [modalMessage, setModalMessage] = useState(""); // Modal message to be shown
  const [showGuide, setShowGuide] = useState(false);
  const refreshPage = () => {
    window.location.reload();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateForm();
  };

  const handleImageUpload = (e) => {
    const { name, files } = e.target;
    setFormData({
      ...formData,
      [name]: files[0],
    });
    validateForm();
  };

  const validateForm = () => {
    if (inputType === "Website URL") {
      setIsValid(formData.website !== "" && formData.url !== "");
    } else if (inputType === "Manual Input") {
      const { productName, productBrand, ingredients, description } = formData;
      setIsValid(productName && productBrand && ingredients && description);
    } else if (inputType === "Image Upload") {
      setIsValid(formData.frontImage && formData.backImage);
    }
  };
  const canvasRef = useRef(null);
  const combineImages = (frontImage, backImage) => {
    return new Promise((resolve) => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");
      const img1 = new Image();
      const img2 = new Image();

      img1.onload = () => {
        canvas.width = img1.width;
        canvas.height = img1.height * 2; // Make room for both images
        ctx.drawImage(img1, 0, 0);

        img2.onload = () => {
          ctx.drawImage(img2, 0, img1.height);
          canvas.toBlob(resolve, "image/jpeg");
        };
        img2.src = URL.createObjectURL(backImage);
      };
      img1.src = URL.createObjectURL(frontImage);
    });
  };
  const isValidURL = (url) => {
    try {
      new URL(url);
      // return true;
    } catch (error) {
      // return false;
      throw new Error("Invalid URL: " + url);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsFormSubmitted(true);
    if (isValid) {
      if (inputType === "Website URL") {
        // Web URL pipeline: /extract-data => /analyze-food
        try {
          // isValidURL(formData.url);

          // 1. Web scrapper endpoint is called
          const response = await fetch(scraperEndpoint, {
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

            // 2. Food analysis endpoint is called
            const analysisResponse = await fetch(analyzeFoodEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...result,
                language: formData.language,
              }),
            });

            if (analysisResponse.ok) {
              console.log(
                "Successfully received a response from /analyze-food"
              );
              const analysisResult = await analysisResponse.json();
              setFinalAnalysis(analysisResult.html_analysis);
              setAlternatives(analysisResult.healthy_alternatives);
            } else {
              console.error("Failed to fetch data from /analyze-food");
            }
          } else {
            console.error("Failed to fetch data from /extract-data");
          }
        } catch (error) {
          setModalMessage("Oops! Something went wrong 😟");
          setShowModal(true);
          console.error("Error:", error);
        }
      } else if (inputType === "Manual Input") {
        // Manual input pipeline: /analyze-food
        try {
          const request = {
            item_name: formData.productName,
            item_brand: formData.productBrand,
            item_ingredients: formData.ingredients,
            item_description: formData.description,
          };
          setResponseData(request);

          // 1. Food analysis endpoint is called
          const analysisResponse = await fetch(analyzeFoodEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              ...request,
              language: formData.language,
            }),
          });

          if (analysisResponse.ok) {
            console.log("Successfully received a response from /analyze-food");
            const analysisResult = await analysisResponse.json();
            setFinalAnalysis(analysisResult.html_analysis);
            setAlternatives(analysisResult.healthy_alternatives);
          } else {
            console.error("Failed to fetch data from /analyze-food");
          }
        } catch (error) {
          setModalMessage("Oops! Something went wrong 😟");
          setShowModal(true);
          console.error("Error:", error);
        }
      } else if (inputType === "Image Upload") {
        // Image Upload pipeline: /img-ocr => /analyze-food
        try {
          const combinedImageBlob = await combineImages(
            formData.frontImage,
            formData.backImage
          );
          const request = new FormData();
          request.append("file", combinedImageBlob, "combined_image.jpg");
          // 1. Image OCR endpoint is called
          const ocrResponse = await fetch(imageOCREndpoint, {
            method: "POST",
            body: request,
          });

          if (ocrResponse.ok) {
            console.log("Successfully received a response from /img-ocr");
            const result = await ocrResponse.json();
            setResponseData(result);

            // 2. Food analysis endpoint is called
            const analysisResponse = await fetch(analyzeFoodEndpoint, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                ...result,
                language: formData.language,
              }),
            });

            if (analysisResponse.ok) {
              console.log("Successfully received a response from /get-data");
              const analysisResult = await analysisResponse.json();
              setFinalAnalysis(analysisResult.html_analysis);
              setAlternatives(analysisResult.healthy_alternatives);
            } else {
              console.error("Failed to fetch data from /get-data");
            }
          } else {
            console.error("Failed to fetch data from /img-ocr");
          }
        } catch (error) {
          setModalMessage("Oops! Something went wrong 😟");
          setShowModal(true);
          console.error("Error:", error);
        }
      }
    } else {
      console.log(
        "Please fill out either Website URL, Ingredients, or upload an image."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-4 text-[#00695C]">
      {showModal ? (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
          <div className="bg-white flex flex-col items-center rounded-lg shadow-lg p-10 w-[32%]">
            <p className="text-gray-600 mb-6">{modalMessage}</p>
            <button
              className="bg-green-500 text-white font-semibold py-2 px-4 rounded focus:outline-none"
              onClick={() => {
                setShowModal(false);
                setModalMessage("");
                refreshPage();
              }}
            >
              Try Again
            </button>
          </div>
        </div>
      ) : null}

      {/* Button and pop-up for steps to use the website */}
      <button
        onClick={() => setShowGuide(true)}
        className="px-4 py-2 mb-4 font-semibold text-white bg-[#34A853] rounded hover:bg-green-600 select-none"
      >
        How to use the website?
      </button>

      {showGuide && (
        <div className="fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-50">
          <div className="flex flex-col justify-around items-center py-10 px-10 lg:py-6 lg:px-10 rounded-lg w-[99%] h-[95%] md:w-3/4 md:h-3/4 bg-white">
            <h2 className="text-xl md:text-2xl font-bold">
              How To Use Our Website?
            </h2>
            <ol className="text-md md:text-lg list-decimal">
              <li>
                Select the language in which you want the analysis of the food
                product.
              </li>
              <li>
                Select the input type:{" "}
                <span className="font-semibold">Website URL</span>,{" "}
                <span className="font-semibold">Manual Input</span> or{" "}
                <span className="font-semibold">Image Upload</span>.
              </li>
              <li>
                If you have selected{" "}
                <span className="font-semibold">Website URL</span>, choose the
                website from the list and enter the link to the product.
              </li>
              <li>
                If you have selected{" "}
                <span className="font-semibold">Manual Input</span>, enter the
                product name, brand, ingredients and description accurately.
              </li>
              <li>
                If you have selected{" "}
                <span className="font-semibold">Image Upload</span>, upload the
                images of the front-side and back-side of the product.
              </li>
              <li>
                After submitting, you can check the{" "}
                <span className="font-semibold">
                  product details, product analysis and other healthy
                  alternatives
                </span>{" "}
                in your preferred language!
              </li>
              <li>
                You can click on the button{" "}
                <span className="font-semibold">
                  &quot;Check Another Product&quot;
                </span>{" "}
                to check other food products.
              </li>
            </ol>
            <p className="text-lg md:text-xl lg:text-2xl text-center">
              All the best on your journey to{" "}
              <span className="text-green-500">Consume Wise</span>ly!
            </p>
            <button
              onClick={() => setShowGuide(false)}
              className="px-4 py-2 mt-4 w-[100px] font-semibold text-white bg-[#34A853] rounded hover:bg-green-600 select-none"
            >
              Close
            </button>
          </div>
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="bg-[#fafafa] w-[90%] md:w-[60%] lg:w-[33%] p-6 lg:p-10 rounded-lg shadow-[10px_10px_60px_#bebebe,-10px_-10px_60px_#ffffff]"
      >
        {/* Language selection dropdown */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Preferred Language</label>
          <select
            name="language"
            value={formData.language}
            onChange={handleInputChange}
            className="w-full p-2 border border-[#00695C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
            title="Select your preferred language for the analysis"
          >
            <option value="English">English</option>
            <option value="Hindi">Hindi</option>
            <option value="Tamil">Tamil</option>
            <option value="Spanish">Spanish</option>
          </select>
        </div>
        {/* Dropdown to choose input type */}
        <div className="mb-4">
          <label className="block font-semibold mb-2">Input Type</label>
          <select
            value={inputType}
            onChange={(e) => {
              setInputType(e.target.value);
              setIsValid(false); // Reset form validation when changing input type
            }}
            className="w-full p-2 border border-[#00695C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
          >
            <option value="">Select an option</option>
            <option value="Website URL">Website URL</option>
            <option value="Manual Input">Manual Input</option>
            <option value="Image Upload">Image Upload</option>
          </select>
        </div>

        {/* Selecting the website */}
        {inputType === "Website URL" && (
          <div className="mb-4">
            <label className="block mb-2">Website</label>
            <select
              name="website"
              value={formData.website}
              onChange={handleInputChange}
              className="w-full p-2 border border-[#00695C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
              title="Select the website in which the packaged product is present"
            >
              <option value="">Select a website</option>
              <option value="Amazon">Amazon</option>
              <option value="Flipkart">Flipkart</option>
              <option value="Bigbasket">Bigbasket</option>
              <option value="Jiomart">Jiomart</option>
            </select>
          </div>
        )}

        {/* Conditional inputs based on selection */}
        {inputType === "Website URL" && (
          <div className="mb-4">
            <label className="block font-medium mb-2">Website URL</label>
            <input
              type="text"
              name="url"
              value={formData.url}
              onChange={handleInputChange}
              className="w-full p-2 border border-[#00695C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
              placeholder="Enter the website URL"
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
                className="w-full p-2 border border-[#00695C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
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
                className="w-full p-2 border border-[#00695C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
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
                className="w-full p-2 border border-[#00695C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
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
                className="w-full p-2 border border-[#00695C] rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
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
            <label className="block font-medium mb-2">
              Upload front and back images of the packaged product. <br />{" "}
              <span className="italic">
                <ul>
                  <li>Front image should include the product cover section.</li>
                  <li>
                    Back image should include the ingredients and details
                    section.
                  </li>
                </ul>
              </span>
            </label>
            <input
              type="file"
              name="frontImage"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
              required
              title="Upload front image of the packaged product"
            />
            <input
              type="file"
              name="backImage"
              accept="image/*"
              onChange={handleImageUpload}
              className="w-full p-2 rounded-md focus:outline-none focus:ring-2 focus:ring-[#34A853]"
              required
              title="Upload back image of the packaged product"
            />
          </div>
        )}

        {/* Submit button appears only when a valid option is selected */}
        {/* {isValid && (
          <button
            type="submit"
            className="w-full bg-[#fafafa] text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-600"
          >
            Submit
          </button>
        )} */}
        <button
          type="submit"
          className={`w-full bg-[#34A853] hover:bg-green-600 text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-[#00695C] ${
            isValid ? "" : "opacity-50 cursor-not-allowed"
          }`}
          disabled={!isValid}
        >
          Submit
        </button>
      </form>
      {/* Display the response from /extract-data */}
      {/* {isFormSubmitted && !responseData && <Loader />} */}
      {responseData && (
        <div className="mt-6 p-8 bg-[#fafafa] rounded-lg border shadow-sm   md:w-[60%] lg:w-[60%]">
          <h3 className="text-xl text-center font-bold mb-3">
            Product Details
          </h3>
          <p>
            <strong>Product Name: </strong> {responseData.item_name}
          </p>
          <p>
            <strong>Brand: </strong> {responseData.item_brand}
          </p>
          <p>
            <strong>Ingredients: </strong> {responseData.item_ingredients}
          </p>
          <p>
            <strong>Description: </strong> {responseData.item_description}
          </p>
        </div>
      )}
      {/* Display the final analysis from /analyze-food */}
      {/* {isFormSubmitted && !finalAnalysis && <Loader />} */}
      {finalAnalysis && (
        <div className="mt-6 p-8 bg-[#fafafa] rounded-lg flex flex-col items-center border shadow-sm   md:w-[60%] lg:w-[60%]">
          <h3 className="text-xl text-center font-bold mb-3">
            Product Analysis
          </h3>
          <div
            dangerouslySetInnerHTML={{ __html: finalAnalysis }}
            id="analysis_html"
          ></div>
        </div>
      )}

      {/* Display the alternatives from /analyze_product */}
      {alternatives && (
        <div className="mt-6 p-8 bg-[#fafafa] rounded-lg border shadow-sm   md:w-[60%] lg:w-[60%]">
          <h3 className="text-xl text-center font-bold mb-3">Alternatives</h3>
          <div
            dangerouslySetInnerHTML={{ __html: alternatives }}
            id="alternatives_html"
          ></div>
        </div>
      )}
      {/* A button to refresh page and check another product */}
      {alternatives && (
        <button
          onClick={refreshPage}
          className="my-4 px-4 py-2 bg-blue-100 font-semibold rounded-lg shadow-md hover:bg-blue-200 hover:shadow-lg focus:outline-none"
        >
          Check Another Product
        </button>
      )}
      {isFormSubmitted && (!finalAnalysis || !responseData) && <Loader />}
      <canvas ref={canvasRef} style={{ display: "none" }} />
    </div>
  );
};

export default InputForm;
