import { useEffect, useState } from "react";
import axios from "axios";

const VolunteerCurrentDonation = () => {
  const [donation, setDonation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [otp, setOtp] = useState('');
  const [showPopup, setShowPopup] = useState(false);
  const [remainingQuantity, setRemainingQuantity] = useState(0);
  const [currentLocation, setCurrentLocation] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    axios
      .get("/api/v1/volunteers/active-donation")
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

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting location:", error);
          alert("Failed to get your location. Please enable GPS.");
        }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  }, []);

  const getRoute = async () => {
    if (!donation) return;

    try {
      const restaurantResponse = await axios.get(`/api/v1/users/${donation.restaurantUser}`, {
        withCredentials: true,
      });

      const restaurantLocation = restaurantResponse.data.location;

      if (!restaurantLocation) {
        throw new Error("Restaurant location data is missing");
      }

      if ("geolocation" in navigator) {
        navigator.geolocation.watchPosition(
          (position) => {
            const { latitude, longitude } = position.coords;
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${latitude},${longitude}&destination=${restaurantLocation.latitude},${restaurantLocation.longitude}`;
            window.open(googleMapsUrl, "_blank");
          },
          (error) => {
            console.error("Error getting location:", error);
            alert("Failed to get your location. Please enable GPS.");
          },
          { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 } // Force fresh location
        );
      } else {
        alert("Geolocation is not supported by your browser.");
      }
    } catch (error) {
      console.error("Error getting location:", error);
      alert("Failed to get location details.");
    }
  };

  const updateStatus = async (newStatus) => {
    if (!donation) return;
    setUpdating(true);
    try {
      const response = await axios.put(`/api/v1/volunteers/update-status/${donation._id}`, {
        status: newStatus,
        otp: newStatus === 'Out for Delivery' ? otp : undefined,
        role: 'volunteer', // Pass the role parameter
      });
      setDonation({ ...donation, status: newStatus });
      if (newStatus === 'Arrival for Pick Up') {
        alert(`OTP sent: ${response.data.otp}`);
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status");
    }
    setUpdating(false);
  };

  const handleDelivered = () => {
    setShowPopup(true);
  };

  const handlePopupSubmit = async (event) => {
    event.preventDefault();
    setUpdating(true);
    try {
      const response = await axios.post(`/api/v1/volunteers/update-delivery-status/${donation._id}`, {
        remainingQuantity,
        currentLocation,
      });
      setDonation({ ...donation, status: 'Delivered' });
      setShowPopup(false);
      alert(response.data.message);
    } catch (error) {
      console.error("Error updating delivery status:", error);
      alert("Failed to update delivery status");
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
                    onClick={handleDelivered}
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

      {showPopup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white p-4 rounded shadow-lg">
            <h2 className="text-lg font-bold mb-4">Enter Remaining Quantity</h2>
            <form onSubmit={handlePopupSubmit}>
              <label htmlFor="remainingQuantity" className="block mb-2">Remaining Quantity:</label>
              <input
                type="number"
                id="remainingQuantity"
                value={remainingQuantity}
                onChange={(e) => setRemainingQuantity(e.target.value)}
                min="0"
                max={donation.quantity}
                required
                className="border px-2 py-1 rounded w-full mb-4"
              />
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
              <button type="button" className="bg-gray-500 text-white px-4 py-2 rounded ml-2" onClick={() => setShowPopup(false)}>Cancel</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default VolunteerCurrentDonation;