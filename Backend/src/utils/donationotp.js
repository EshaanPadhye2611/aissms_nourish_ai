import twilio from 'twilio';
import dotenv from 'dotenv';
import { FoodDonation } from '../models/fooddonation.models.js';
import { User } from '../models/user.models.js';

dotenv.config(); // Load environment variables

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

export const generateAndSendOTPForDonation = async (donationId) => {
  const donation = await FoodDonation.findById(donationId).populate('restaurantUser');
  if (!donation) {
    throw new Error('Donation not found');
  }

  const recipients = await User.find({ role: { $in: ['volunteer', 'ngo'] } });
  if (!recipients || recipients.length === 0) {
    throw new Error('No recipients found');
  }

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

  donation.otp = otp;
  donation.otpExpiry = otpExpiry;
  await donation.save();

  for (const recipient of recipients) {
    if (!recipient.phoneNumber) {
      console.error(`Recipient ${recipient._id} does not have a phone number`);
      continue;
    }

    const formattedPhoneNumber = recipient.phoneNumber.startsWith('+') ? recipient.phoneNumber : `+91${recipient.phoneNumber}`;

    try {
      const message = await client.messages.create({
        body: `Your OTP for food donation pick up is ${otp}. Food Item: ${donation.foodName}, Quantity: ${donation.quantity}, Expiry Date: ${new Date(donation.expiryDate).toLocaleDateString()}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhoneNumber
      });
      console.log(`OTP sent to ${formattedPhoneNumber}: ${message.sid}`);
    } catch (error) {
      console.error('Error sending OTP:', error);
    }
  }

  return otp;
};