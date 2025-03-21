import React, { useEffect, useState } from 'react';
import axios from 'axios';

const RedistributionHistoryPopup = ({ show, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (show) {
      axios.get(`${import.meta.env.VITE_BASE_URL}/api/v1/volunteers/redistribution-history`)
        .then(response => {
          setHistory(response.data);
          setLoading(false);
        })
        .catch(error => {
          console.error('Error fetching redistribution history:', error);
          setLoading(false);
        });
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg w-3/4">
        <h2 className="text-lg font-bold mb-4">Redistribution History</h2>
        {loading ? (
          <div>Loading...</div>
        ) : history.length === 0 ? (
          <div>No redistribution history available.</div>
        ) : (
          <table className="min-w-full bg-white border border-gray-300 border-collapse">
            <thead>
              <tr className="hover:bg-gray-100">
                <th className="py-2 px-4 border-b">Food Name</th>
                <th className="py-2 px-4 border-b">Volunteer Name</th>
                <th className="py-2 px-4 border-b">Remaining Quantity</th>
                <th className="py-2 px-4 border-b">Expiry Date</th>
                <th className="py-2 px-4 border-b">Restaurant</th>
              </tr>
            </thead>
            <tbody>
              {history.map(item => (
                <tr key={item._id} className="hover:bg-gray-100">
                  <td className="py-2 px-4 border-b">{item.foodName}</td>
                  <td className="py-2 px-4 border-b">{item.volunteerName}</td>
                  <td className="py-2 px-4 border-b">{item.remainingQuantity}</td>
                  <td className="py-2 px-4 border-b">{new Date(item.expiryDate).toLocaleDateString()}</td>
                  <td className="py-2 px-4 border-b">{item.restaurant ? item.restaurant.name : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        <button className="mt-4 bg-red-500 text-white px-4 py-2 rounded" onClick={onClose}>Close</button>
      </div>
    </div>
  );
};

export default RedistributionHistoryPopup;