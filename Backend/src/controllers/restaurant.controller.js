import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.models.js";
import { Restaurant } from "../models/restaurants.models.js"
import { FoodDonation } from "../models/fooddonation.models.js";
import { RestaurantFoodItem } from "../models/restaurantFoodItems.models.js";
import { Volunteer } from "../models/volunteer.models.js";
import { Ngo } from "../models/ngo.models.js";
//import { uploadToCloudinary  } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import { generateAndSendOTPForDonation } from "../utils/donationotp.js";

const generateAccessToken = async(userId) => {
    try{
        const user  = await Restaurant.findById(userId);
        const accessToken = user.generateAccessToken();
        // const refreshToken = user.generateRefreshToken();
        // user.refreshToken = refreshToken;
        await user.save({ validateBeforeSave: false});
        return { accessToken };
}   catch (error) {
        throw new ApiError(500, "Failed to generate tokens");
    }
}

// const loginRestaurantUser = asyncHandler(async(req, res) => {
//     const {email, password} = req.body;
//     if(!email){
//         throw new ApiError(400, "Email is required");
//     }
//     if(!password){
//         throw new ApiError(400, "Password is required");
//     }
//     const user = await Restaurant.findOne({
//         email
//     })
//     if(!user){
//         throw new ApiError(404, "User not found, Unauthorised");
//     }
//     const isPasswordValid = await user.isPasswordCorrect(password);
//     if(!isPasswordValid){
//         throw new ApiError(401, "Invalid password");
//     }
//     const {accessToken} = await generateAccessToken(user._id)
//     const loggedInUser = await Restaurant.findById(user._id).select("-password");
//     const options = {
//         httpOnly: true,
//         secure: true
//     }
//     return res.status(200)
//     .cookie("accessToken", accessToken, options)
//     // .cookie("refreshToken", refreshToken, options)  
//     .json(
//         new ApiResponse(200, 
//             {
//                 user: loggedInUser, accessToken
//             },
//             "User logged in successfully")
//     )
// })

// const getFoodItems = asyncHandler(async (req, res) => {
//     const userId = req.user._id; // Assuming req.user is populated by authentication middleware

//     const foodItems = await RestaurantFoodItem.find({ restaurantUser: userId });


//     // Update statuses for all food items
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

//             if (item.status !== newStatus) {
//                 await RestaurantFoodItem.findByIdAndUpdate(
//                     item._id,
//                     { $set: { status: newStatus } },
//                     { new: true }
//                 );
//             }

//             return { ...item._doc, status: newStatus };
//         })
//     );

//     return res.status(200).json(new ApiResponse(200, updatedFoodItems, "Food items fetched successfully"));
// });

const getFoodItems = asyncHandler(async (req, res) => {
    const userId = req.user._id;

    const foodItems = await RestaurantFoodItem.find({ restaurantUser: userId });

    // Update statuses for all food items that are NOT marked as "used" and have quantity > 0
    const updatedFoodItems = await Promise.all(
        foodItems.map(async (item) => {
            if (item.status === "used" || item.quantity === 0) {
                // Ensure items with quantity 0 are marked as "used"
                if (item.quantity === 0 && item.status !== "used") {
                    await RestaurantFoodItem.findByIdAndUpdate(
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
                await RestaurantFoodItem.findByIdAndUpdate(
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

const updateFoodItemStatus = asyncHandler(async (req, res) => {
    const { itemId } = req.params;
    const { status, quantity } = req.body;

    console.log("🔹 Received Request - Item ID:", itemId, " | Status:", status, " | Quantity:", quantity);

    if (!itemId || status === undefined || quantity === undefined) {
        console.error("❌ Missing parameters: Item ID, status, and quantity are required");
        throw new ApiError(400, "Item ID, status, and quantity are required");
    }

    const foodItem = await RestaurantFoodItem.findById(itemId);
    console.log("🔹 Fetched Food Item:", foodItem);

    if (!foodItem) {
        console.error("❌ Food item not found");
        throw new ApiError(404, "Food item not found");
    }

    if (foodItem.restaurantUser.toString() !== req.user._id.toString()) {
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
    const newFoodItem = new RestaurantFoodItem({
        name,
        quantity,
        manufacturingDate: manufacturingDateISO,
        expiryDate: expiryDateISO,
        status,
        restaurantUser: req.user._id, // Attach user reference
    });

    await newFoodItem.save();

    res.status(201).json(newFoodItem);
});

const donateFoodItem = asyncHandler(async (req, res) => {
    const { foodName, quantity, expiryDate, schedulePickUp, foodType } = req.body;

    // Log to verify the incoming data format
    console.log("Received foodName:", foodName);
    console.log("Received quantity:", quantity);
    console.log("Received expiryDate:", expiryDate);
    console.log("Received schedulePickUp:", schedulePickUp);
    console.log("Received foodType:", foodType);

    // Ensure all fields are provided
    if (!(foodName && quantity && expiryDate && schedulePickUp && foodType)) {
      throw new ApiError(400, "All fields are required");
    }

    // Convert dates from DD/MM/YYYY to ISO format (YYYY-MM-DD)
    const [expiryDay, expiryMonth, expiryYear] = expiryDate.split("/").map(Number);
    const [pickupDay, pickupMonth, pickupYear] = schedulePickUp.split("/").map(Number);

    const expiryDateISO = new Date(expiryYear, expiryMonth - 1, expiryDay);
    const schedulePickUpISO = new Date(pickupYear, pickupMonth - 1, pickupDay);

    if (isNaN(expiryDateISO.getTime()) || isNaN(schedulePickUpISO.getTime())) {
      throw new ApiError(400, "Invalid date format");
    }

    // Check that the expiry date is at least one day greater than the current date
    const currentDate = new Date();
    if (expiryDateISO <= currentDate) {
      throw new ApiError(400, "Expiry date must be at least one day greater than the current date");
    }

    // Find the restaurant from the database
    const restaurant = await User.findById(req.user._id).select("name pincode");
    if (!restaurant) {
      throw new ApiError(404, "Restaurant not found");
    }

    // Create the food donation entry
    const foodDonation = new FoodDonation({
      foodName,
      quantity,
      foodType,
      expiryDate: expiryDateISO,
      schedulePickUp: schedulePickUpISO,
      restaurantUser: req.user._id,
      restaurantName: restaurant.name,
      restaurantPincode: restaurant.pincode,
    });

    await foodDonation.save();
    await generateAndSendOTPForDonation(foodDonation._id);
    return res.status(201).json(new ApiResponse(201, foodDonation, "Food item donated successfully"));
});  

const foodDonationHistory = asyncHandler(async (req, res) => {
    const userId = req.user._id;
    console.log(userId);
    const donationHistory = await FoodDonation.find({restaurantUser: userId});
    console.log(donationHistory);
    return res.status(200).json(new ApiResponse(200, donationHistory, "Food donation history fetched successfully"));
})

// const checkDeliveryStatus = asyncHandler(async(req, res) => {
//         try {
//             const userId = req.user._id;
    
//             // Find all donations where restaurantUser matches userId and status is NOT "Pending"
//             const deliveryStatus = await FoodDonation.find({
//                 restaurantUser: userId,
//                 status: { $ne: "Pending" } // Excludes documents where status is "Pending"
//             });
    
//             res.status(200).json({
//                 success: true,
//                 message: "Delivery status fetched successfully",
//                 data: deliveryStatus
//             });
//         } catch (error) {
//             res.status(500).json({
//                 success: false,
//                 message: "Error fetching delivery status",
//                 error: error.message
//             });
//         }
//     })

const checkDeliveryStatus = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;

        // Fetch donations where restaurantUser matches userId and status is NOT "Pending"
        const deliveryStatus = await FoodDonation.find({
            restaurantUser: userId,
            status: { $ne: "Pending" }
        });

        // Extract unique acceptedById values
        const acceptedUserIds = deliveryStatus
            .map(donation => donation.acceptedById)
            .filter(id => id); // Remove null/undefined values

        // Fetch names from Volunteer and Ngo schemas
        const [volunteers, ngos] = await Promise.all([
            Volunteer.find({ _id: { $in: acceptedUserIds } }).select("name"),
            Ngo.find({ _id: { $in: acceptedUserIds } }).select("name")
        ]);

        // Create a lookup object for acceptedById -> name
        const userMap = {};
        volunteers.forEach(vol => (userMap[vol._id] = vol.name));
        ngos.forEach(ngo => (userMap[ngo._id] = ngo.name));

        // Update each FoodDonation entry with the acceptedBy name
        await Promise.all(
            deliveryStatus.map(async donation => {
                if (userMap[donation.acceptedById]) {
                    await FoodDonation.findByIdAndUpdate(donation._id, {
                        acceptedBy: userMap[donation.acceptedById]
                    });
                }
            })
        );

        // Fetch updated data after modifications
        const updatedDeliveryStatus = await FoodDonation.find({
            restaurantUser: userId,
            status: { $ne: "Pending" }
        });

        res.status(200).json({
            success: true,
            message: "Delivery status updated and fetched successfully",
            data: updatedDeliveryStatus
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Error updating and fetching delivery status",
            error: error.message
        });
    }
});

const getRestaurantLeaderboard = asyncHandler(async (req, res) => {
    const restaurantId = req.user._id;

    // Get top 5 restaurant donors
    const topDonors = await FoodDonation.aggregate([
        {
            $match: {
                status: { $in: ["Delivered", "Accepted", "Out for Delivery"] }
            }
        },
        {
            $group: {
                _id: "$restaurantUser",
                restaurantName: { $first: "$restaurantName" },
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
                as: "restaurantDetails"
            }
        },
        { $unwind: "$restaurantDetails" },
        {
            $match: {
                "restaurantDetails.role": "restaurant"
            }
        },
        {
            $project: {
                _id: 1,
                name: "$restaurantName",
                totalQuantity: 1,
                donationsCount: 1
            }
        },
        { $sort: { totalQuantity: -1 } }
    ]);

    // Get user's position
    const userPosition = topDonors.findIndex(donor => 
        donor._id.toString() === restaurantId.toString()
    ) + 1;

    // Get restaurant's donation data
    const restaurantData = topDonors.find(donor => 
        donor._id.toString() === restaurantId.toString()
    );

    return res.status(200).json(
        new ApiResponse(200, {
            topDonors: topDonors.slice(0, 5),
            userRank: {
                position: userPosition,
                ...restaurantData
            }
        }, "Restaurant leaderboard fetched successfully")
    );
});

export {  addFoodItem, getFoodItems, donateFoodItem, foodDonationHistory, checkDeliveryStatus, getRestaurantLeaderboard, updateFoodItemStatus }