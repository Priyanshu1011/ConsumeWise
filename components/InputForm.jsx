"use client";
import { useState } from "react";

const InputForm = () => {
  const [formData, setFormData] = useState({
    website: "",
    url: "",
    ingredients: "",
    image: null,
  });

  const [isValid, setIsValid] = useState(false);

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
    const { url, ingredients, image } = formData;
    setIsValid(url || ingredients || image); // Check if any one of the three is filled
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (isValid) {
      console.log(formData);
      // Handle form submission logic here
    } else {
      alert(
        "Please fill out either Website URL, Ingredients, or upload an image."
      );
    }
  };

  return (
    <div className="flex flex-col items-center justify-center gap-y-4 text-blue-800">
      <form
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
      </form>
    </div>
  );
};

export default InputForm;
