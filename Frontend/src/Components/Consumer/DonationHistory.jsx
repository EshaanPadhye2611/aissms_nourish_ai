import React, { useEffect, useState } from "react";
import axios from "axios";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { FaTimes, FaCheckCircle, FaClock, FaTruck, FaExclamationTriangle } from "react-icons/fa";
import AOS from "aos";
import "aos/dist/aos.css";

const statusIcons = {
  Pending: { icon: <FaClock className="text-yellow-500" />, label: "Pending" },
  Accepted: { icon: <FaCheckCircle className="text-blue-500" />, label: "Accepted" },
  "Out for Delivery": { icon: <FaTruck className="text-orange-500" />, label: "Out for Delivery" },
  Delivered: { icon: <FaCheckCircle className="text-green-500" />, label: "Delivered" },
  Expired: { icon: <FaExclamationTriangle className="text-red-500" />, label: "Expired" },
};

const DonationHistory = ({ onClose }) => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    AOS.init({ duration: 800, once: true });
    const fetchDonations = async () => {
      try {
        const response = await axios.get("/api/v1/users/donation-history", {
          withCredentials: true,
        });
        setDonations(response.data.data);
      } catch (err) {
        setError("Failed to load donation history");
      } finally {
        setLoading(false);
      }
    };

    fetchDonations();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen text-xl font-semibold">
        Loading donation history...
      </div>
    );
  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen text-red-500 text-lg font-bold">
        {error}
      </div>
    );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div
        data-aos="flip-up"
        className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-4xl transform transition-all duration-500"
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Donation History</h2>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 transition duration-300"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Table */}
        {donations.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white border border-gray-300 border-collapse rounded-lg shadow-md">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="py-3 px-4 border-b text-left">Meal Description</th>
                  <th className="py-3 px-4 border-b text-left">Quantity</th>
                  <th className="py-3 px-4 border-b text-left">Pick-up Date</th>
                  <th className="py-3 px-4 border-b text-left">Pincode</th>
                  <th className="py-3 px-4 border-b text-left">Status</th>
                </tr>
              </thead>
              <tbody>
                {donations.map((donation) => (
                  <tr
                    key={donation._id}
                    className="hover:bg-gray-50 transition duration-300"
                  >
                    <td className="py-3 px-4 border-b">{donation.foodName}</td>
                    <td className="py-3 px-4 border-b">{donation.quantity}</td>
                    <td className="py-3 px-4 border-b">
                      {new Date(donation.schedulePickUp).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 border-b">{donation.pincode}</td>
                    <td className="py-3 px-4 border-b flex items-center space-x-2">
                      {statusIcons[donation.status]?.icon}
                      <span>{statusIcons[donation.status]?.label}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-gray-600 text-center mt-4">
            No donation history available.
          </div>
        )}
        <ToastContainer />
      </div>
    </div>
  );
};

export default DonationHistory;