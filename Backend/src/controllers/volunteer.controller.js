import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import {FoodItem } from "../models/foodItems.models.js"
import { FoodDonation } from "../models/fooddonation.models.js";
import { Volunteer } from "../models/volunteer.models.js"; 
import { User } from "../models/user.models.js"
import { generateAndSendOTP, verifyOTP } from '../utils/otp.js';
import { VolunteerRedistribute } from "../models/volunteerRedistribute.model.js";
export const generateAccessToken = async(userId) => {
    try{
        const user = await Volunteer.findById(userId);
        const accessToken = user.generateAccessToken();
        // const refreshToken = user.generateRefreshToken();
        // user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});
        return { accessToken };
}   catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
} 

// const loginVolunteer = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     if (!email) throw new ApiError(400, "Email is required");
//     if (!password) throw new ApiError(400, "Password is required");

//     const user = await Volunteer.findOne({ email });
//     if (!user) throw new ApiError(404, "User not found, Unauthorized");

//     const isPasswordValid = await user.isPasswordCorrect(password);
//     if (!isPasswordValid) throw new ApiError(401, "Invalid password");

//     const { accessToken } = await generateAccessToken(user._id);

//     const foodItems = await FoodItem.find({ user: user._id });

//     // Update status for all food items and include them in the response
//     const updatedFoodItems = await Promise.all(
//         foodItems.map(async (item) => {
//             const today = new Date();
//             const expiry = new Date(item.expiryDate);
//             const diffTime = expiry - today;
//             const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

//             let newStatus = "";
//             if (diffDays > 7) newStatus = "good";
//             else if (diffDays <= 7 && diffDays >= 0) newStatus = "expiring soon";
//             else newStatus = "expired";

//             // Update the database only if the status has changed
//             if (item.status !== newStatus) {
//                 await FoodItem.findByIdAndUpdate(
//                     item._id,
//                     { $set: { status: newStatus } },
//                     { new: true }
//                 );
//             }

//             // Always return the food item with its updated status
//             return { ...item._doc, status: newStatus };
//         })
//     );

//     const loggedInUser = await Volunteer.findById(user._id).select("-password");

//     const options = {
//         httpOnly: true,
//         secure: true,
//     };

//     return res
//         .status(200)
//         .cookie("accessToken", accessToken, options)
//         .json(
//             new ApiResponse(
//                 200,
//                 {
//                     loggedInUser,
//                     accessToken,
//                     updatedFoodItems, // Return all food items
//                 },
//                 "User logged in successfully"
//             )
//         );
// });

// Get all food donations

const getAllFoodDonations = asyncHandler(async (req, res) => {
    const { volunteerId } = req.query;

    if (!volunteerId) {
        throw new ApiError(400, "Volunteer ID is required");
    }

    // Check if the volunteer exists
    const volunteer = await User.findById(volunteerId);
    if (!volunteer) {
        throw new ApiError(404, "Volunteer not found");
    }

    // Fetch all food donations with "Pending" status
    const foodDonations = await FoodDonation.find({ status: "Pending" })
        .populate("restaurantUser", "name") // Always populate restaurantUser
        // .populate("volunteer", "name email") // Populate volunteer if it's assigned
        .sort({ createdAt: -1 }); // Sort by latest

    return res.status(200).json(new ApiResponse(200, foodDonations, "Food donations fetched successfully"));
});

// Accept food donation by volunteer
const acceptFoodDonation = asyncHandler(async (req, res) => {
    const { donationId } = req.params; // Donation ID from URL
    const { volunteerId } = req.body; // Volunteer ID from request body

    if (!(donationId && volunteerId)) {
        throw new ApiError(400, "Donation ID and Volunteer ID are required");
    }

    // Check if the volunteer exists
    const volunteer = await User.findById(volunteerId);
    if (!volunteer) {
        throw new ApiError(404, "Volunteer not found");
    }

    // Check if the volunteer already has an active donation (i.e., "Accepted" or "Out for Delivery")
    const existingDonation = await FoodDonation.findOne({
        acceptedById: volunteerId,
        status: { $in: ["Accepted", "Out for Delivery"] }, // Ongoing donations
    });

    if (existingDonation) {
        throw new ApiError(400, "You can only accept one donation at a time. Complete the current donation first.");
    }

    // Find the food donation
    const foodDonation = await FoodDonation.findById(donationId);

    if (!foodDonation) {
        throw new ApiError(404, "Food donation not found");
    }

    // Check if the donation is already accepted
    if (foodDonation.status !== "Pending") {
        throw new ApiError(400, "This food donation has already been accepted or is no longer pending.");
    }

    // Assign the volunteer and update status
    foodDonation.status = "Accepted";
    foodDonation.acceptedById = volunteerId;
    foodDonation.acceptedBy = volunteer.name;
    await foodDonation.save();

    return res.status(200).json(new ApiResponse(200, foodDonation, "Food donation accepted successfully"));
});

// Reject food donation by volunteer (optional)
const rejectFoodDonation = asyncHandler(async (req, res) => {
    const { donationId } = req.params; // Donation ID from URL

    if (!donationId) {
        throw new ApiError(400, "Donation ID is required");
    }

    // Find the food donation to ensure it exists
    const foodDonation = await FoodDonation.findById(donationId);

    if (!foodDonation) {
        throw new ApiError(404, "Food donation not found");
    }

    // Do not update the status; just confirm the donation exists
    return res.status(200).json(
        new ApiResponse(200, null, "Food donation removed from your view")
    );
});

const getDonationHistory = asyncHandler(async (req, res) => {
    const volunteerId = req.user._id;

    if (!volunteerId) {
        throw new ApiError(400, "Volunteer ID is required");
    }

    // Check if the volunteer exists
    const volunteer = await User.findById(volunteerId);
    if (!volunteer) {
        throw new ApiError(404, "Volunteer not found");
    }

    // Fetch all donations accepted by the volunteer
    const donationHistory = await FoodDonation.find({ acceptedById: volunteerId })
        .populate("restaurantUser", "name")
        .sort({ createdAt: -1 });

    if (donationHistory.length === 0) {
        return res.status(200).json(new ApiResponse(200, [], "No donation history found."));
    }

    return res.status(200).json(new ApiResponse(200, donationHistory, "Donation history fetched successfully"));
});


const getActiveDonation = asyncHandler(async (req, res) => {
    const volunteerId = req.user._id;

    if (!volunteerId) {
        throw new ApiError(400, "Volunteer ID is required");
    }

    // Check if the volunteer exists
    const volunteer = await User.findById(volunteerId);
    if (!volunteer) {
        throw new ApiError(404, "Volunteer not found");
    }

    // Fetch the active donation for the volunteer
    const activeDonation = await FoodDonation.findOne({
        acceptedById: volunteerId,
        status: { $in: ["Accepted", "Out for Delivery"] },
    });

    // If no active donation, return an empty response instead of throwing an error
    if (!activeDonation) {
        return res.status(200).json(new ApiResponse(200, null, "No active donation available"));
    }

    return res.status(200).json(new ApiResponse(200, activeDonation, "Active donation fetched successfully"));
});
    


// Controller for updating the status of a donation
const updateDonationStatus = async (req, res) => {
    const { donationId } = req.params;
    const { status, otp } = req.body;

    try {
        console.log(`Updating donation status for donationId: ${donationId}, status: ${status}`);

        const donation = await FoodDonation.findById(donationId);
        if (!donation) {
            console.error('Donation not found');
            return res.status(404).json({ message: 'Donation not found' });
        }

        if (status === 'Arrival for Pick Up') {
            console.log(`Sending OTP to restaurant for donationId: ${donationId}`);
            const otp = await generateAndSendOTP(donationId, 'volunteer');
            return res.status(200).json({ message: 'OTP sent successfully', otp });
        }

        if (status === 'Out for Delivery' && otp) {
            console.log(`Verifying OTP for donationId: ${donationId}`);
            await verifyOTP(donationId, otp, 'volunteer');
        }

        donation.status = status;
        await donation.save();

        console.log('Donation status updated successfully');
        res.status(200).json({ message: 'Donation status updated successfully', data: donation });
    } catch (error){
        console.error('Error updating donation status:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Controller to get incoming redistributions
const getIncomingRedistributions = asyncHandler(async (req, res) => {
    try {
        const redistributions = await VolunteerRedistribute.find({ status: "Redistributed" })
            .populate("donor", "name")
            .populate("volunteer", "name");

        return res.status(200).json(new ApiResponse(200, redistributions, "Incoming redistributions fetched successfully"));
    } catch (error) {
        console.error("Error fetching incoming redistributions:", error);
        throw new ApiError(500, "Failed to fetch incoming redistributions");
    }
});

// Controller to get redistribution history
const getRedistributionHistory = asyncHandler(async (req, res) => {
    try {
        const volunteerId = req.user._id;
        const redistributions = await VolunteerRedistribute.find({ volunteer: volunteerId })
            .populate("donor", "name")
            .populate("volunteer", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json(new ApiResponse(200, redistributions, "Redistribution history fetched successfully"));
    } catch (error) {
        console.error("Error fetching redistribution history:", error);
        throw new ApiError(500, "Failed to fetch redistribution history");
    }
});

// Controller to accept a redistribution
const acceptRedistribution = asyncHandler(async (req, res) => {
    const { redistributionId } = req.params;
    const volunteerId = req.user._id;

    try {
        const redistribution = await VolunteerRedistribute.findById(redistributionId);

        if (!redistribution) {
            return res.status(404).json(new ApiResponse(404, null, "Redistribution not found"));
        }

        redistribution.status = "Redistribute Accepted";
        redistribution.volunteerId = volunteerId;
        await redistribution.save();

        return res.status(200).json(new ApiResponse(200, redistribution, "Redistribution accepted successfully"));
    } catch (error) {
        console.error("Error accepting redistribution:", error);
        throw new ApiError(500, "Failed to accept redistribution");
    }
});

// Controller to update redistribution status to delivered
const updateRedistributionStatusToDelivered = asyncHandler(async (req, res) => {
    const { redistributionId } = req.params;

    try {
        const redistribution = await VolunteerRedistribute.findById(redistributionId);

        if (!redistribution) {
            return res.status(404).json(new ApiResponse(404, null, "Redistribution not found"));
        }

        redistribution.status = "Delivered";
        await redistribution.save();

        return res.status(200).json(new ApiResponse(200, redistribution, "Redistribution status updated to delivered"));
    } catch (error) {
        console.error("Error updating redistribution status:", error);
        throw new ApiError(500, "Failed to update redistribution status");
    }
});

// Define the function
const updateDeliveryStatusWithRemainingQuantity = asyncHandler(async (req, res) => {
    const { redistributionId, remainingQuantity } = req.body;

    try {
        const redistribution = await VolunteerRedistribute.findById(redistributionId);

        if (!redistribution) {
            return res.status(404).json(new ApiResponse(404, null, "Redistribution not found"));
        }

        redistribution.remainingQuantity = remainingQuantity;
        redistribution.status = "Partially Delivered";
        await redistribution.save();

        return res.status(200).json(new ApiResponse(200, redistribution, "Redistribution status updated with remaining quantity"));
    } catch (error) {
        console.error("Error updating redistribution status with remaining quantity:", error);
        throw new ApiError(500, "Failed to update redistribution status");
    }
});

export {  getAllFoodDonations, rejectFoodDonation, acceptFoodDonation, getDonationHistory, getActiveDonation,updateDonationStatus, getIncomingRedistributions, getRedistributionHistory, acceptRedistribution, updateRedistributionStatusToDelivered, updateDeliveryStatusWithRemainingQuantity }