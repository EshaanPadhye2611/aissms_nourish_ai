import { useEffect, useState } from "react";
import axios from "axios";

const DonationHistory = () => {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/api/v1/volunteers/donation-history")
      .then((response) => {
        if (response.data.data && response.data.data.length > 0) {
          setDonations(response.data.data);
        } else {
          setDonations([]);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching donation history:", error);
        setError("Failed to load donation history.");
        setLoading(false);
      });
  }, []);

  return (
    <div className="bg-white shadow-lg rounded-xl p-8 border border-gray-200 w-full min-h-screen">
      <h2 className="text-3xl font-bold mb-6 text-green-900 border-b pb-4">Donation History</h2>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : error ? (
        <div className="text-red-600 text-center">{error}</div>
      ) : donations.length === 0 ? (
        <div className="text-gray-500 text-center py-4">No donations found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">Food Name</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">Food Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">Expiry Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">Pick-up Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">Restaurant</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-green-900 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {donations.map((donation) => (
                <tr key={donation._id} className="hover:bg-gray-50 transition-colors duration-150 ease-in-out">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{donation.foodName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{donation.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{donation.foodType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {new Date(donation.expiryDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">
                    {new Date(donation.schedulePickUp).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800">{donation.restaurantName}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span
                      className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        donation.status === "Delivered"
                          ? "bg-green-100 text-green-800"
                          : donation.status === "Pending"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {donation.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default DonationHistory;
