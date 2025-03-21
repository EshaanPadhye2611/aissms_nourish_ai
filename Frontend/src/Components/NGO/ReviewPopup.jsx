import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const ReviewPopup = ({ show, onClose, donationId }) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      await axios.post(`/api/v1/ngos/review/${donationId}`, { rating, comment });
      toast.success('Review submitted successfully');
      onClose();
    } catch (error) {
      console.error('Error submitting review:', error);
      toast.error('Failed to submit review');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white p-4 rounded shadow-lg w-3/4">
        <h2 className="text-lg font-bold mb-4">Rate and Review</h2>
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="rating">
              Rating
            </label>
            <select
              id="rating"
              value={rating}
              onChange={(e) => setRating(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              required
            >
              <option value="">Select Rating</option>
              <option value="1">1 - Poor</option>
              <option value="2">2 - Fair</option>
              <option value="3">3 - Good</option>
              <option value="4">4 - Very Good</option>
              <option value="5">5 - Excellent</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="comment">
              Comment
            </label>
            <textarea
              id="comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
              rows="4"
              required
            ></textarea>
          </div>
          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={onClose}
            >
              Submit
            </button>
            <button
              type="button"
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
              onClick={onClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReviewPopup;