import { User } from "../models/user.models.js"
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { uploadToCloudinary } from "../utils/cloudinary.js";
import { sendOTP, verifyOTP } from "../utils/otpVerification.js";

/**
 * Function to send OTP before registration
 */
export const sendOtp = async (req, res) => {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }
  
    try {
      const otpSent = await sendOTP(email);
      if (!otpSent) {
        return res.status(500).json({ message: "Failed to send OTP" });
      }
      res.status(200).json({ success: true, message: "OTP sent successfully" });
    } catch (error) {
      console.error("Error sending OTP:", error);
      res.status(500).json({ message: "Error sending OTP" });
    }
  };

const registerUser = async(req, res) => {
    const { email, otp } = req.body;
    if (!verifyOTP(email, otp)) {
        return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    try {
        console.log("Registration request received:", {
            body: req.body,
            file: req.file
        });

        const { 
            email, 
            name, 
            password, 
            address, 
            pincode, 
            role, 
            phoneNumber, 
            latitude, 
            longitude 
        } = req.body;

        let verificationDocUrl;
        
        // Handle file upload for specific roles
        if (['restaurant', 'ngo', 'catering/university mess'].includes(role) && req.file) {
            const cloudinaryResponse = await uploadToCloudinary(req.file.path);
            console.log("Cloudinary upload response:", cloudinaryResponse);
            
            if (cloudinaryResponse && cloudinaryResponse.url) {
                verificationDocUrl = cloudinaryResponse.url;
                console.log("Document uploaded successfully:", verificationDocUrl);
            } else {
                throw new Error("Failed to upload verification document");
            }
        }

        const newUser = new User({
            name,
            email,
            password,
            address,
            pincode,
            role,
            phoneNumber,
            location: {
                latitude,
                longitude
            },
            verificationDoc: verificationDocUrl
        });

        await newUser.save();

        res.status(201).json({
            success: true,
            message: "User registered successfully",
            data: {
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                verificationDoc: verificationDocUrl
            }
        });

    } catch (error) {
        console.error("Registration error:", error);
        res.status(500).json({
            success: false,
            message: error.message || "Registration failed"
        });
    }
};

const loginUser = async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        
        if(!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if(!isMatch) {
            return res.status(400).json({ 
                success: false,
                message: "Invalid password" 
            });
        }

        const accessToken = jwt.sign(
            {
                _id: user._id,
                role: user.role,
                email: user.email,
                name: user.name,
            }, 
            process.env.ACCESS_TOKEN_SECRET,
            { expiresIn: process.env.ACCESS_TOKEN_EXPIRY }
        );

        return res.status(200)
            .cookie("accessToken", accessToken, { 
                httpOnly: true, 
                secure: true 
            })
            .json({
                success: true,
                accessToken,
                user: {
                    _id: user._id,
                    email: user.email,
                    role: user.role,
                    name: user.name,
                },
            });
    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({
            success: false,
            message: "Login failed"
        });
    }
};

export { registerUser, loginUser };