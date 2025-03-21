import nodemailer from "nodemailer";

const otpStore = new Map();
const OTP_EXPIRY_TIME = 5 * 60 * 1000; // 5 minutes

/**
 * Generate and send OTP via email
 * @param {string} email
 * @returns {boolean} success status
 */
export const sendOTP = async (email) => {
  const otp = Math.floor(100000 + Math.random() * 900000); // Generate 6-digit OTP
  const expiresAt = Date.now() + OTP_EXPIRY_TIME; // Set expiry time
  otpStore.set(email, { otp, expiresAt });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "ryashraj8218@gmail.com",
      pass: "tdij bgpf vrxl alue",// Use environment variables
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: "Your OTP for Registration",
    text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`OTP sent to ${email}`); // Avoid logging the OTP itself
    return true;
  } catch (error) {
    console.error("Error sending OTP:", error);
    return false;
  }
};

/**
 * Verify OTP
 * @param {string} email
 * @param {string} otp
 * @returns {boolean} isValid
 */
export const verifyOTP = (email, otp) => {
  const storedOtpData = otpStore.get(email);

  if (!storedOtpData) {
    return false; // No OTP found for the email
  }

  const { otp: storedOtp, expiresAt } = storedOtpData;

  if (Date.now() > expiresAt) {
    otpStore.delete(email); // Remove expired OTP
    return false; // OTP expired
  }

  if (storedOtp.toString() === otp) {
    otpStore.delete(email); // Remove OTP after successful verification
    return true;
  }

  return false; // OTP does not match
};