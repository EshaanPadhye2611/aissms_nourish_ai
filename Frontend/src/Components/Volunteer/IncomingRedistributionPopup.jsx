import React, { useEffect, useState } from 'react';
import axios from 'axios';

const IncomingRedistributionPopup = ({ show, onClose }) => {
  const [redistributions, setRedistributions] = useState([]);
  const [currentLocation, setCurrentLocation] = useState({ latitude: null, longitude: null });

  useEffect(() => {
    if (show) {
      axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/volunteers/incoming-redistributions`)
        .then(response => {
          setRedistributions(response.data);
        })
        .catch(error => {
          console.error('Error fetching redistributions:', error);
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
    }
  }, [show]);

  const handleAccept = async (redistributionId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/volunteers/accept-redistribution/${redistributionId}`, { currentLocation });
      alert('Redistribution accepted successfully');
      onClose();
    } catch (error) {
      console.error('Error accepting redistribution:', error);
      alert('Failed to accept redistribution');
    }
  };

  const handleDelivered = async (redistributionId) => {
    try {
      await axios.post(`${import.meta.env.VITE_BASE_URL}/api/v1/volunteers/update-redistribution-status/${redistributionId}/delivered`);
      alert('Redistribution status updated to Delivered successfully');
      onClose();
    } catch (error) {
      console.error('Error updating redistribution status to Delivered:', error);
      alert('Failed to update redistribution status to Delivered');
    }
  };

  const getRoute = (redistribution) => {
    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${currentLocation.latitude},${currentLocation.longitude}&destination=${redistribution.currentLocation.latitude},${redistribution.currentLocation.longitude}`;
    window.open(googleMapsUrl, "_blank");
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg w-3/4">
        <h2 className="text-lg font-bold mb-4">Incoming Redistributions</h2>
        <table className="min-w-full bg-white border border-gray-300 border-collapse">
          <thead>
            <tr className="hover:bg-gray-100">
              <th className="py-2 px-4 border-b">Food Name</th>
              <th className="py-2 px-4 border-b">Volunteer Name</th>
              <th className="py-2 px-4 border-b">Remaining Quantity</th>
              <th className="py-2 px-4 border-b">Expiry Date</th>
              <th className="py-2 px-4 border-b">Actions</th>
            </tr>
          </thead>
          <tbody>
            {redistributions.map(redistribution => (
              <tr key={redistribution._id} className="hover:bg-gray-100">
                <td className="py-2 px-4 border-b">{redistribution.foodName}</td>
                <td className="py-2 px-4 border-b">{redistribution.volunteerName}</td>
                <td className="py-2 px-4 border-b">{redistribution.remainingQuantity}</td>
                <td className="py-2 px-4 border-b">{new Date(redistribution.expiryDate).toLocaleDateString()}</td>
                <td className="py-2 px-4 border-b">
                  {redistribution.status === 'Redistributed' && (
                    <button className="bg-green-500 text-white px-3 py-1 rounded" onClick={() => handleAccept(redistribution._id)}>
                      Accept Redistribute
                    </button>
                  )}
                  {redistribution.status === 'Redistribute Accepted' && (
                    <button className="bg-blue-500 text-white px-3 py-1 ml-2 rounded" onClick={() => handleDelivered(redistribution._id)}>
                      Mark as Delivered
                    </button>
                  )}
                  <button className="bg-blue-500 text-white px-3 py-1 ml-2 rounded" onClick={() => getRoute(redistribution)}>
                    Get Route
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <button className="mt-4 bg-red-500 text-white px-4 py-2 rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default IncomingRedistributionPopup;