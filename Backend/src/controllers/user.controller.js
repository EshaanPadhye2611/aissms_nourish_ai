import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { FoodItem } from "../models/foodItems.models.js"
import { SingleMeal } from "../models/singleMeal.models.js";
//import { uploadToCloudinary  } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { generateAndSendOTP, verifyOTP } from '../utils/otp.js';

const generateAccessToken = async(userId) => {
    try{
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        // const refreshToken = user.generateRefreshToken();
        // user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});
        return { accessToken };
}   catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
} 

// Controller function to get user details by user ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// const loginUser = asyncHandler(async (req, res) => {
//     const { email, password } = req.body;

//     if (!email) throw new ApiError(400, "Email is required");
//     if (!password) throw new ApiError(400, "Password is required");

//     const user = await User.findOne({ email });
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

//     const loggedInUser = await User.findById(user._id).select("-password");

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

const getFoodItems = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const foodItems = await FoodItem.find({ user: userId });

    // Update statuses for all food items that are NOT marked as "used" and have quantity > 0
    const updatedFoodItems = await Promise.all(
        foodItems.map(async (item) => {
            if (item.status === "used" || item.quantity === 0) {
                // Ensure items with quantity 0 are marked as "used"
                if (item.quantity === 0 && item.status !== "used") {
                    await FoodItem.findByIdAndUpdate(
                        item._id,
                        { $set: { status: "used" } },
                        { new: true }
                    );
                    return { ...item._doc, status: "used" };
                }
                return item; // Skip updating "used" items
            }

            const today = new Date();
            const expiry = new Date(item.expiryDate);
            const diffTime = expiry - today;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            let newStatus = "";
            if (diffDays > 7) newStatus = "good";
            else if (diffDays <= 7 && diffDays > 0) newStatus = "expiring soon";
            else newStatus = "expired";

            if (item.status !== newStatus) {
                await FoodItem.findByIdAndUpdate(
                    item._id,
                    { $set: { status: newStatus } },
                    { new: true }
                );
            }

            return { ...item._doc, status: newStatus };
        })
    );

    // Filter to include only 'good' and 'expiring soon' items
    const filteredItems = updatedFoodItems.filter(item => 
        item.status === "good" || item.status === "expiring soon"
    );

    console.log(filteredItems);
    return res.status(200).json(
        new ApiResponse(
            200, 
            filteredItems, 
            "Active food items fetched successfully"
        )
    );
});

// Update Food Item Status
const updateFoodItemStatus = asyncHandler(async (req, res) => {
    try {
        const { itemId } = req.params;
        const { status, quantity } = req.body;

        console.log("🔹 Received Request - Item ID:", itemId, " | Status:", status, " | Quantity:", quantity);

        if (!itemId || status === undefined || quantity === undefined) {
            console.error("❌ Missing parameters: Item ID, status, and quantity are required");
            throw new ApiError(400, "Item ID, status, and quantity are required");
        }

        const foodItem = await FoodItem.findById(itemId);
        console.log("🔹 Fetched Food Item:", foodItem);

        if (!foodItem) {
            console.error("❌ Food item not found");
            throw new ApiError(404, "Food item not found");
        }

        if (foodItem.user.toString() !== req.user._id.toString()) {
            console.error("❌ Unauthorized: User does not own this item");
            throw new ApiError(403, "You are not authorized to update this item");
        }

        if (quantity < 0 || quantity > foodItem.quantity) {
            console.error("❌ Invalid quantity");
            throw new ApiError(400, "Invalid quantity entered");
        }

        // Update quantity and status
        foodItem.quantity = quantity;
        foodItem.status = quantity === 0 ? "used" : status;
        await foodItem.save();

        console.log("✅ Updated Food Item:", foodItem);

        return res.status(200).json(new ApiResponse(200, foodItem, "Food item status and quantity updated successfully"));
    } catch (error) {
        console.error("❌ Error updating food item status:", error);
        return res.status(500).json(new ApiResponse(500, null, "Failed to update food item status"));
    }
});

const addFoodItem = asyncHandler(async (req, res) => {
    const updateFoodItemStatus = (expiryDate) => {
        const today = new Date();
        const expiry = new Date(expiryDate); // Converts "YYYY-MM-DD" to a valid Date object
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays > 7) {
            return "good";
        } else if (diffDays <= 7 && diffDays >= 0) {
            return "expiring soon";
        } else {
            return "expired";
        }
    };

    const { name, quantity, manufacturingDate, expiryDate } = req.body;

    // Convert normal dates to ISO format
    const manufacturingDateISO = new Date(manufacturingDate).toISOString();
    const expiryDateISO = new Date(expiryDate).toISOString();

    // Validate input
    if (!(name && quantity && manufacturingDateISO && expiryDateISO)) {
        throw new ApiError(400, "All fields are required");
    }

    // Determine status
    const status = updateFoodItemStatus(expiryDate);

    // Create and save the new food item
    const newFoodItem = new FoodItem({
        name,
        quantity,
        manufacturingDate: manufacturingDateISO,
        expiryDate: expiryDateISO,
        status,
        user: req.user._id, // Attach user reference
    });

    await newFoodItem.save();

    res.status(201).json(newFoodItem);
});

const addSingleMeal = asyncHandler(async (req, res) => {
    const { foodName, quantity, schedulePickUp } = req.body;

    // Validate input
    if (!(foodName && quantity && schedulePickUp)) {
        throw new ApiError(400, "All fields are required");
    }

    // Create and save the new meal
    const user = await User.findById(req.user._id);
    console.log(user)
    const newMeal = new SingleMeal({
        foodName,
        quantity,
        schedulePickUp: new Date(schedulePickUp).toISOString(),
        donor: req.user._id, // Attach user reference
        pincode: user.pincode // Get the pincode of the user
    });
    console.log(newMeal)

    await newMeal.save();

    res.status(201).json(newMeal);
});

const getSingleMeals = asyncHandler(async (req, res) => {
    const userId = req.user._id; // Assuming `req.user` is populated by authentication middleware

    // Get the user's pincode
    const user = await User.findById(userId);
    const userPincode = user.pincode;

    // Define the pincode range
    // const minpincodeRange = userPincode - 2
    // const maxincodeRange = userPincode - 2
    // Find meals uploaded by users within the pincode range
    const singleMeals = await SingleMeal.find({
        donor: { $ne: userId}, // Exclude meals uploaded by the user
        // quantity: { $gte: 5 },
         status: "Pending",   
        // pincode: { $gte: minpincodeRange, $lte: maxincodeRange }
    }).populate('donor', 'name'); // Populate the donor field with the name
    console.log(singleMeals)

    return res.status(200).json(new ApiResponse(200, singleMeals, "Single meals fetched successfully"));
});

const acceptSingleMeal = asyncHandler(async (req, res) => {
    const { mealId } = req.params;
    const userId = req.user._id;

    const meal = await SingleMeal.findById(mealId);
    if (!meal) {
        return res.status(404).json(new ApiResponse(404, null, "Meal not found"));
    }

    const user = await User.findById(userId);
    if (!user) {
        return res.status(404).json(new ApiResponse(404, null, "User not found"));
    }

    meal.status = "Accepted";
    meal.acceptedById = userId;
    meal.acceptedBy = user.name; // Set the acceptedBy field with the user's name
    await meal.save();

    return res.status(200).json(new ApiResponse(200, meal, "Meal accepted successfully"));
});

// const rejectSingleMeal = asyncHandler(async (req, res) => {
//     const { mealId } = req.params;

//     const meal = await SingleMeal.findById(mealId);
//     if (!meal) {
//         return res.status(404).json(new ApiResponse(404, null, "Meal not found"));
//     }

//     meal.status = "Rejected";
//     await meal.save();

//     return res.status(200).json(new ApiResponse(200, meal, "Meal rejected successfully"));
// });
const rejectSingleMeal = asyncHandler(async (req, res) => {
    const { mealId } = req.params; // Donation ID from URL
    // Find the food donation to ensure it exists
    const meal = await SingleMeal.findById(mealId);

    if (!meal) {
        return res.status(404).json(new ApiResponse(404, null, "Meal not found"));
    }

    // Do not update the status; just confirm the donation exists
    return res.status(200).json(
        new ApiResponse(200, null, "Food donation removed from your view")
    );
});

const getDonationHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const { status } = req.query;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Fetch all donations created by the user with the specified status
    const query = { donor: userId };
    if (status) {
        query.status = status;
    }

    const donationHistory = await SingleMeal.find(query)
        .populate("donor", "name")
        .sort({ createdAt: -1 });

    return res.status(200).json(new ApiResponse(200, donationHistory, "Donation history fetched successfully"));
});

const getActiveDonation = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id; // Ensure userId exists
        if (!userId) {
            return res.status(400).json({ message: "User ID is required" });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }

        const activeDonation = await SingleMeal.findOne({
            donor: userId,
            status: { $in: ["Accepted", "Out for Delivery"] },
        }).populate("donor", "name").populate("acceptedBy", "name");

        if (!activeDonation) {
            return res.status(200).json({ message: "No active donation found", data: null });
        }

        return res.status(200).json({ data: activeDonation, message: "Active donation fetched successfully" });
    } catch (error) {
        console.error("Error in getActiveDonation:", error); // Log the actual error
        res.status(500).json({ message: "Internal Server Error", error: error.message });
    }
});




const updateDonationStatus = asyncHandler(async (req, res) => {
    const { donationId } = req.params; // Get the donation ID from the URL parameters
    const { status, otp, role } = req.body; // Get the new status and role from the request body

    try {
        console.log(`Updating donation status for donationId: ${donationId}, status: ${status}, role: ${role}`);

        // Find the donation by its ID
        const donation = await SingleMeal.findById(donationId);

        if (!donation) {
            return res.status(404).json({ message: 'Donation not found' });
        }

        if (status === 'Arrival for Pick Up') {
            const otp = await generateAndSendOTP(donationId, role);
            return res.status(200).json({ message: 'OTP sent successfully', otp });
        }

        if (status === 'Out for Delivery' && otp) {
            await verifyOTP(donationId, otp, role);
        }

        // Update the donation's status
        donation.status = status;

        // Save the updated donation to the database
        await donation.save();

        // Return the updated donation
        res.status(200).json({
            message: 'Donation status updated successfully',
            data: donation,
        });
    } catch (error) {
        console.error('Error updating donation status:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

const getActiveMeals = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    if (!userId) {
        throw new ApiError(400, "User ID is required");
    }

    // Check if the user exists
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404, "User not found");
    }

    // Fetch the active meals for the user
    const activeMeals = await SingleMeal.find({
        acceptedById: userId,
        status: { $in: ["Accepted", "Out for Delivery"] },
    }).populate("donor", "name");

    return res.status(200).json(new ApiResponse(200, activeMeals, "Active meals fetched successfully"));
});

const getUserLeaderboard = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    // Get top 5 individual donors
    const topDonors = await SingleMeal.aggregate([
        {
            $match: {
                status: { $in: ["Delivered", "Accepted", "Out for Delivery"] }
            }
        },
        {
            $group: {
                _id: "$donor",
                totalQuantity: {
                    $sum: {
                        $toInt: {
                            $replaceAll: {
                                input: "$quantity",
                                find: " ",
                                replacement: ""
                            }
                        }
                    }
                },
                donationsCount: { $sum: 1 }
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "_id",
                foreignField: "_id",
                as: "userDetails"
            }
        },
        { $unwind: "$userDetails" },
        {
            $match: {
                "userDetails.role": "individual"
            }
        },
        {
            $project: {
                _id: 1,
                name: "$userDetails.name",
                totalQuantity: 1,
                donationsCount: 1
            }
        },
        { $sort: { totalQuantity: -1 } }
    ]);

    // Get all donors for ranking
    const allDonors = [...topDonors];
    
    // Find user's position
    const userPosition = allDonors.findIndex(donor => 
        donor._id.toString() === userId.toString()
    ) + 1;

    // Get user's donation data
    const userData = allDonors.find(donor => 
        donor._id.toString() === userId.toString()
    );

    return res.status(200).json(
        new ApiResponse(200, {
            topDonors: topDonors.slice(0, 5),
            userRank: {
                position: userPosition,
                ...userData
            }
        }, "Leaderboard fetched successfully")
    );
});

export { addFoodItem, getFoodItems, addSingleMeal, getSingleMeals, acceptSingleMeal, rejectSingleMeal, getDonationHistory, getActiveDonation, updateDonationStatus, getActiveMeals, getUserLeaderboard, updateFoodItemStatus };


