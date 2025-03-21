import { Router } from "express";
import { addFoodItem, getFoodItems, addSingleMeal, getSingleMeals, acceptSingleMeal, rejectSingleMeal, getDonationHistory, getActiveDonation, updateDonationStatus, getActiveMeals, getUserLeaderboard, updateFoodItemStatus, getUserById } from "../controllers/user.controller.js";
import { verifyUserJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";

const router = Router();

// router.route("/login").post(loginUser)

router.route("/getFoodItems").get(verifyUserJWT, authorizeRoles("individual"), getFoodItems)

router.route("/updateFoodItemStatus/:itemId").put(verifyUserJWT, authorizeRoles("individual"), updateFoodItemStatus);

// router.route("/getFoodItems").get(verifyUserJWT, authorizeRoles(['individuals']), getFoodItems);

router.route("/addFoodItem").post(verifyUserJWT,authorizeRoles("individual"),  addFoodItem)

router.route("/addMeal").post(verifyUserJWT, authorizeRoles("individual"), addSingleMeal)

router.route("/getMeal").get(verifyUserJWT, authorizeRoles("individual"), getSingleMeals)

router.post("/meals/:mealId/accept", verifyUserJWT, authorizeRoles("individual"), acceptSingleMeal);
router.post("/meals/:mealId/reject", verifyUserJWT, authorizeRoles("individual"), rejectSingleMeal);

router.route("/donation-history").get(verifyUserJWT, authorizeRoles("individual"), getDonationHistory);
router.route("/active-donation").get(verifyUserJWT, authorizeRoles("individual"), getActiveDonation);
router.put('/update-status/:donationId',verifyUserJWT, authorizeRoles("individual"), updateDonationStatus);

router.route("/active-meals").get(verifyUserJWT, authorizeRoles("individual"), getActiveMeals);


router.get("/user-ranking", 
    verifyUserJWT, 
    authorizeRoles("individual"), 
    getUserLeaderboard
);

router.get('/:userId', verifyUserJWT, getUserById);

export default router;