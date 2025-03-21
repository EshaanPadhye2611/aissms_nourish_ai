import React, { useEffect, useState } from 'react';
import axios from 'axios';
import ReviewPopup from './ReviewPopup.jsx'; // Import the ReviewPopup component

const NgoCurrentAcceptPage = () => {
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [otp, setOtp] = useState('');
  const [showReviewPopup, setShowReviewPopup] = useState(false);

  useEffect(() => {
    axios
      .get("/api/v1/ngos/active-donation")
      .then((response) => {
        if (response.data && response.data.data) {
          setDonation(response.data.data);
        } else {
          console.error("Invalid data format:", response.data);
          setDonation(null);
        }
        setLoading(false);
      })
      .catch((error) => {
        console.error("Error fetching data:", error);
        setDonation(null);
        setLoading(false);
      });
  }, []);

  const getRoute = async () => {
    if (!donation) return;

    try {
      const ngoResponse = await axios.get(`/api/v1/users/${donation.acceptedById}`, {
        withCredentials: true,
      });
      const restaurantResponse = await axios.get(`/api/v1/users/${donation.restaurantUser}`, {
        withCredentials: true,
      });

      const ngoLocation = ngoResponse.data.location;
      const restaurantLocation = restaurantResponse.data.location;
      console.log("NGO Location:");
      console.log(ngoLocation);
      console.log("Restaurant Location:");
      console.log(restaurantLocation);
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${ngoLocation.latitude},${ngoLocation.longitude}&destination=${restaurantLocation.latitude},${restaurantLocation.longitude}`;
      window.open(googleMapsUrl, "_blank");
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Failed to get location details.");
    }
  };

  const updateStatus = async (newStatus) => {
    if (!donation) return;
    setUpdating(true);
    try {
      const response = await axios.put(`/api/v1/ngos/update-status/${donation._id}`, {
        status: newStatus,
        otp: newStatus === 'Out for Delivery' ? otp : undefined,
        role: 'ngo'
      });
      setDonation({ ...donation, status: newStatus });
      if (newStatus === 'Arrival for Pick Up') {
        alert(`OTP sent: ${response.data.otp}`);
      }
      if (newStatus === 'Delivered') {
        setShowReviewPopup(true);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
    setUpdating(false);
  };

  return (
    <div className="bg-white shadow rounded-lg p-4 border border-black w-full min-h-screen">
      {loading ? (
        <div>Loading...</div>
      ) : donation ? (
        <table className="min-w-full bg-white border border-gray-300 border-collapse">
          <thead>
            <tr className="hover:bg-gray-100">
              <th className="py-2 px-4 border-b">Food Name</th>
              <th className="py-2 px-4 border-b">Quantity</th>
              <th className="py-2 px-4 border-b">Expiry Date</th>
              <th className="py-2 px-4 border-b">Pick-up Date</th>
              <th className="py-2 px-4 border-b">Restaurant (Pincode)</th>
              <th className="py-2 px-4 border-b">Status</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-gray-100">
              <td className="py-2 px-4 border-b">{donation.foodName}</td>
              <td className="py-2 px-4 border-b">{donation.quantity}</td>
              <td className="py-2 px-4 border-b">{new Date(donation.expiryDate).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">{new Date(donation.schedulePickUp).toLocaleDateString()}</td>
              <td className="py-2 px-4 border-b">{donation.restaurantName} ({donation.restaurantPincode})</td>
              <td className="py-2 px-4 border-b">{donation.status}</td>
              <td className="py-2 px-4 border-b">
                <button className="bg-blue-500 text-white px-3 py-1 rounded" onClick={getRoute}>
                  Get Route
                </button>
                {donation.status === "Accepted" && (
                  <button
                    className="bg-yellow-500 text-white px-3 py-1 ml-2 rounded"
                    onClick={() => updateStatus("Arrival for Pick Up")}
                    disabled={updating}
                  >
                    Arrival for Pick Up
                  </button>
                )}
                {donation.status === "Arrival for Pick Up" && (
                  <>
                    <input
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter OTP"
                      className="ml-2 px-2 py-1 border rounded"
                    />
                    <button
                      className="bg-green-500 text-white px-3 py-1 ml-2 rounded"
                      onClick={() => updateStatus("Out for Delivery")}
                      disabled={updating}
                    >
                      Confirm Pick Up
                    </button>
                  </>
                )}
                {donation.status === "Out for Delivery" && (
                  <button
                    className="bg-green-500 text-white px-3 py-1 ml-2 rounded"
                    onClick={() => updateStatus("Delivered")}
                    disabled={updating}
                  >
                    Delivered
                  </button>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      ) : (
        <div>No donation data available.</div>
      )}
      {donation && (
        <ReviewPopup show={showReviewPopup} onClose={() => setShowReviewPopup(false)} donationId={donation._id} />
      )}
    </div>
  );
};

export default NgoCurrentAcceptPage;