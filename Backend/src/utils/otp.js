import { SingleMeal } from '../models/singleMeal.models.js';
import { FoodDonation } from '../models/fooddonation.models.js';
import { User } from '../models/user.models.js';
import twilio from 'twilio';
import dotenv from 'dotenv';

dotenv.config(); // Load environment variables

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

console.log(`Twilio Account SID: ${accountSid}`);
console.log(`Twilio Auth Token: ${authToken ? 'Loaded' : 'Not Loaded'}`);
console.log(`Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);

const getModelByRole = (role) => {
    if (role === 'individual') {
        return SingleMeal;
    } else if (role === 'ngo' || role === 'volunteer') {
        return FoodDonation;
    } else {
        throw new Error('Invalid role');
    }
};

export const generateAndSendOTP = async (donationId, role) => {
    try{
        const Model = getModelByRole(role);
    let donation;

    if (role === 'individual') {
        donation = await Model.findById(donationId).populate('donor');
    } else {
        donation = await Model.findById(donationId).populate('restaurantUser');
    }

    if (!donation) {
        throw new Error('Donation not found');
    }

    let recipient;
    if (role === 'individual') {
        recipient = await User.findById(donation.donor._id);
    } else {
        recipient = await User.findById(donation.restaurantUser._id);
    }

    if (!recipient || !recipient.phoneNumber) {
        throw new Error('Recipient phone number not found');
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP valid for 10 minutes

    donation.otp = otp;
    donation.otpExpiry = otpExpiry;
    await donation.save();

    // Ensure phone number is in the correct format
    const formattedPhoneNumber = recipient.phoneNumber.startsWith('+') ? recipient.phoneNumber : `+91${recipient.phoneNumber}`;

    await client.messages.create({
        body: `Your OTP for food donation pick up is ${otp}. Food Item: ${donation.foodName}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: formattedPhoneNumber
    });

    return otp;
    }
    catch (error) {

        if (error.code === 20003) {
            console.error('Twilio authentication failed. Please check your credentials.');
            console.log(`Twilio Account SID: ${accountSid}`);
            console.log(`Twilio Auth Token: ${authToken ? 'Loaded' : 'Not Loaded'}`);
            console.log(`Twilio Phone Number: ${process.env.TWILIO_PHONE_NUMBER}`);
        } else {
            console.error('Error sending OTP:', error);
        }
        throw error;
    }};
    

export const verifyOTP = async (donationId, otp, role) => {
    const Model = getModelByRole(role);
    const donation = await Model.findById(donationId);

    if (!donation) {
        throw new Error('Donation not found');
    }

    if (donation.otp !== otp || donation.otpExpiry < new Date()) {
        throw new Error('Invalid or expired OTP');
    }

    // Clear OTP after successful verification
    donation.otp = null;
    donation.otpExpiry = null;
    await donation.save();

    return true;
};