import mongoose from 'mongoose';

const VolunteerRedistributeSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'FoodDonation', required: true },
  foodName: { type: String, required: true },
  volunteerName: { type: String, required: true },
  volunteerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer', required: true },
  acceptedById: { type: mongoose.Schema.Types.ObjectId, ref: 'Volunteer' },
  remainingQuantity: { type: Number, required: true },
  expiryDate: { type: Date, required: true },
  restaurant: { type: mongoose.Schema.Types.ObjectId, ref: 'Restaurant', required: true },
  currentLocation: {
    type: {
      latitude: { type: Number, required: true },
      longitude: { type: Number, required: true }
    },
    required: true
  },
  status: { 
    type: String, 
    enum: ["Pending", "Accepted", "Delivered", "Redistributed", "Redistribute Accepted"], 
    default: "Pending" 
  }
});

export const VolunteerRedistribute = mongoose.model('VolunteerRedistribute', VolunteerRedistributeSchema);
