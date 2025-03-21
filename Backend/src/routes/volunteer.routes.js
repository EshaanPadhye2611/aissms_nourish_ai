import { Volunteer } from "../models/volunteer.models.js";
import { verifyVolunteerJWT } from "../middlewares/auth.middleware.js";
import { verifyUserJWT } from "../middlewares/auth.middleware.js";
import { authorizeRoles } from "../middlewares/role.middleware.js";
import {  getAllFoodDonations, rejectFoodDonation, acceptFoodDonation, getActiveDonation, getDonationHistory, updateDonationStatus, updateDeliveryStatusWithRemainingQuantity } from "../controllers/volunteer.controller.js"
import {  getIncomingRedistributions, getRedistributionHistory, acceptRedistribution, updateRedistributionStatusToDelivered } from "../controllers/volunteer.controller.js";
import { Router } from "express";

const router = Router();

// router.route("/login").post(loginVolunteer)
router.route("/getDonations").get(verifyUserJWT, authorizeRoles("volunteer"), getAllFoodDonations)
router.post("/:donationId/accept",verifyUserJWT, authorizeRoles("volunteer"), acceptFoodDonation); // Accept a donation
router.post("/:donationId/reject",verifyUserJWT, authorizeRoles("volunteer"), rejectFoodDonation); // Reject a donation (optional)
// Reject a food donation without status change
router.route("/donation-history").get(verifyUserJWT, authorizeRoles("volunteer"), getDonationHistory);
router.route("/active-donation").get(verifyUserJWT, authorizeRoles("volunteer"), getActiveDonation);
router.put('/update-status/:donationId',verifyUserJWT, authorizeRoles("volunteer"), updateDonationStatus);
router.post('/update-delivery-status/:donationId', verifyUserJWT, authorizeRoles("volunteer"), updateDeliveryStatusWithRemainingQuantity);
router.get('/incoming-redistributions', verifyUserJWT, authorizeRoles("volunteer"), getIncomingRedistributions);
router.get('/redistribution-history', verifyUserJWT, authorizeRoles("volunteer"), getRedistributionHistory);
router.post('/accept-redistribution/:redistributionId', verifyUserJWT, authorizeRoles("volunteer"), acceptRedistribution);
router.post('/update-redistribution-status/:redistributionId/delivered', verifyUserJWT, authorizeRoles("volunteer"), updateRedistributionStatusToDelivered);

export default router;