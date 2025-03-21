import React, { useState, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaMicrophone, FaAppleAlt } from "react-icons/fa";
import { MdRectangle } from "react-icons/md";
import { motion } from "framer-motion"; 
import AOS from "aos";
import "aos/dist/aos.css"; 

const Form = ({ closeModal, updateFoodItems }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    foodName: "",
    quantity: "",
    expiryDate: "",
    schedulePickUp: "",
    foodType: "",
  });

  useEffect(() => {
    AOS.init();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  // Voice Recognition for Food Name Input
  const handleVoiceInput = () => {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.start();

    recognition.onresult = (event) => {
      const voiceText = event.results[0][0].transcript;
      setFormData((prevData) => ({ ...prevData, foodName: voiceText }));
      toast.success("Voice input recognized!");
    };

    recognition.onerror = (event) => {
      console.error("Voice recognition error:", event.error);
      toast.error("Could not recognize speech. Try again.");
    };
  };

  const formatDate = (date) => {
    const d = new Date(date);
    const day = ("0" + d.getDate()).slice(-2);
    const month = ("0" + (d.getMonth() + 1)).slice(-2);
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("Form Data Submitted:", formData);

    const formattedData = {
      ...formData,
      expiryDate: formatDate(formData.expiryDate),
      schedulePickUp: formatDate(formData.schedulePickUp),
    };

    try {
      const response = await axios.post(
        "/api/v1/restaurants/donateFood",
        formattedData,
        { withCredentials: true }
      );

      if (response.status === 200 || response.status === 201) {
        toast.success("Donation submitted successfully!", { position: "top-center", autoClose: 3000 });
        console.log("Server Response:", response.data);
        setFormData({
          foodName: "",
          quantity: "",
          expiryDate: "",
          schedulePickUp: "",
          foodType: "",
        });
        updateFoodItems(response.data);
        setTimeout(() => {
          closeModal();
        }, 2000);
      } else {
        toast.error("Failed to submit donation. Please try again.", { position: "top-center", autoClose: 3000 });
      }
    } catch (error) {
      console.log("Submitting Data:", formattedData);
      console.error("Error submitting form:", error);
      toast.error("An error occurred. Please try again later.", { position: "top-center", autoClose: 3000 });
    }
  };

  return (
    <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-4xl mx-auto" data-aos="fade-up">
      <ToastContainer />
      
      {/* Back Button */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={closeModal}
          className="p-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 focus:outline-none transform hover:scale-110 transition-transform"
        >
          <FaArrowLeft className="text-xl" />
        </button>
      </div>

      {/* Title */}
      <div className="flex items-center justify-center mb-6" data-aos="flip-up" data-aos-delay="200">
        <h2 className="text-3xl font-bold text-gray-800">Food Donation Form</h2>
      </div>

      {/* Inspirational Quote */}
      <motion.div
        className="text-center text-lg font-semibold text-gray-600 mb-6"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <p>"One meal can make a difference. Together, we make hunger history!"</p>
      </motion.div>

      {/* Form Fields */}
      <form className="grid grid-cols-1 gap-4" onSubmit={handleSubmit}>
        <div data-aos="flip-up">
          <label className="font-semibold flex items-center">
            <FaAppleAlt className="text-green-500 mr-2" /> Food Name
          </label>
          <div className="flex items-center border p-3 rounded-lg">
            <input
              type="text"
              name="foodName"
              value={formData.foodName}
              onChange={handleChange}
              placeholder="Enter food name"
              className="w-full focus:outline-none focus:ring-2 focus:ring-green-500 transition"
              required
            />
            <button onClick={handleVoiceInput} className="ml-2 text-green-600 hover:text-green-700">
              <FaMicrophone className="text-xl" />
            </button>
          </div>
        </div>

        <div data-aos="flip-up" data-aos-delay="100">
          <label className="font-semibold flex items-center">
            <MdRectangle className="text-green-500 mr-2" /> Quantity
          </label>
          <input
            type="text"
            name="quantity"
            value={formData.quantity}
            onChange={handleChange}
            placeholder="e.g., 10 kg"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            required
          />
        </div>

        <div data-aos="flip-up" data-aos-delay="200">
          <label className="font-semibold flex items-center">Expiry Date</label>
          <input
            type="date"
            name="expiryDate"
            value={formData.expiryDate}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            required
          />
        </div>

        <div data-aos="flip-up" data-aos-delay="300">
          <label className="font-semibold flex items-center">Schedule Pick-Up</label>
          <input
            type="date"
            name="schedulePickUp"
            value={formData.schedulePickUp}
            onChange={handleChange}
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            required
          />
        </div>

        <div data-aos="flip-up" data-aos-delay="400">
          <label className="font-semibold flex items-center">Food Type</label>
          <input
            type="text"
            name="foodType"
            value={formData.foodType}
            onChange={handleChange}
            placeholder="e.g., Fruits, Grains"
            className="w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
            required
          />
        </div>
      </form>

      {/* Buttons */}
      <div className="flex justify-center gap-4 mt-6">
        <button
          type="submit"
          onClick={handleSubmit}
          className="bg-green-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-green-700 transition-transform transform hover:scale-110"
        >
          Donate
        </button>
        <button
          onClick={closeModal}
          className="bg-blue-600 text-white py-3 px-6 rounded-lg shadow-lg hover:bg-blue-700 transition-transform transform hover:scale-110"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default Form;
