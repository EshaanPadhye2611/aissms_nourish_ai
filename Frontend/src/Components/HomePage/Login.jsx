import React, { useState } from "react";
import axios from "axios";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { FaLock, FaPersonCircleCheck, FaArrowLeft, FaUserPlus } from "react-icons/fa6";
import "react-toastify/dist/ReactToastify.css";
import { hourglass } from 'ldrs';
import AOS from "aos";
import "aos/dist/aos.css";
import { useEffect } from "react";


hourglass.register();

const Login = ({ closeModal }) => {
    const [isLogin, setIsLogin] = useState(true);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        password: "",
        name: "",
        address: "",
        latitude: "",
        longitude: "",
        pincode: "",
        role: "individual",
        phoneNumber: "",
        agreeToTerms: false
    });
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [showOtpModal, setShowOtpModal] = useState(false); // New state for OTP modal
    const [otp, setOtp] = useState("");
    const navigate = useNavigate();

    const fetchCurrentLocation = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setFormData(prev => ({
                        ...prev,
                        latitude: position.coords.latitude.toString(),
                        longitude: position.coords.longitude.toString()
                    }));
                    toast.success("Location fetched successfully!");
                },
                (error) => {
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            toast.error("User denied location access");
                            break;
                        case error.POSITION_UNAVAILABLE:
                            toast.error("Location information unavailable");
                            break;
                        case error.TIMEOUT:
                            toast.error("Location request timed out");
                            break;
                        default:
                            toast.error("An unknown error occurred");
                    }
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 0
                }
            );
        } else {
            toast.error("Geolocation is not supported by your browser");
        }
    };


    const handleInputChange = (e) => {
        const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setFormData({
            ...formData,
            [e.target.name]: value
        });
    };

    const loginHandler = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        const userData = { email: formData.email, password: formData.password };

        try {
            const response = await axios.post("/api/v1/auth/login", userData);
            console.log(response);

            if (response.status === 200) {
                const data = response.data;
                localStorage.setItem("accessToken", data.accessToken);
                localStorage.setItem("userId", data.user._id);
                localStorage.setItem("userEmail", data.user.email);
                localStorage.setItem("userRole", data.user.role);
                localStorage.setItem("userName", data.user.name);
                toast.success("Logged in Successfully");

                setTimeout(() => {
                    if (data.user.role === "individual") {
                        navigate("/consumer");
                    } else if (data.user.role === "restaurant") {
                        navigate("/retailer");
                    } else if (data.user.role === "ngo") {
                        navigate("/ngo");
                    } else if (data.user.role === "volunteer") {
                        navigate("/volunteer");
                    }
                    closeModal();
                }, 1000);
            }
        } catch (error) {
            toast.error("Invalid Credentials");
        } finally {
            setTimeout(() => {
                setIsLoading(false);
            }, 1000);
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.type === "application/pdf" || file.type.startsWith("image/")) {
                if (file.size <= 5 * 1024 * 1024) { // 5MB limit
                    setFormData(prev => ({
                        ...prev,
                        verificationDoc: file
                    }));
                    toast.success("File selected successfully");
                } else {
                    toast.error("File size should be less than 5MB");
                    e.target.value = null;
                }
            } else {
                toast.error("Please upload only PDF or image files");
                e.target.value = null;
            }
        }
    };

        // Function to send OTP
    const sendOtpHandler = async () => {
        try {
            const response = await axios.post("/api/v1/auth/send-otp", { email: formData.email });
            if (response.data.success) {
                toast.success("OTP sent to your email!");
                setShowOtpModal(true); // Show OTP modal
            } else {
                toast.error(response.data.message || "Failed to send OTP");
            }
        } catch (error) {
            toast.error("Error sending OTP");
        }
    };

    // Function to verify OTP and complete registration
    // Function to handle registration
const registerHandler = async (e) => {
    e.preventDefault();

    // Validation checks
    if (!formData.agreeToTerms) {
        toast.error("Please agree to Terms & Conditions");
        return;
    }

    if (!formData.latitude || !formData.longitude) {
        toast.error("Please fetch your current location");
        return;
    }

    // Check if document is required for selected role
    const requiresDoc = ['restaurant', 'ngo', 'catering/university mess'].includes(formData.role);
    if (requiresDoc && !formData.verificationDoc) {
        toast.error("Please upload verification document");
        return;
    }

    try {
        // Step 1: Send OTP to the user's email
        const response = await axios.post("/api/v1/auth/send-otp", { email: formData.email });
        if (response.data.success) {
            toast.success("OTP sent to your email!");
            setShowOtpModal(true); // Show OTP modal
        } else {
            toast.error(response.data.message || "Failed to send OTP");
        }
    } catch (error) {
        toast.error("Error sending OTP");
    }
};

// Function to verify OTP and complete registration
const verifyOtpAndRegister = async () => {
    try {
        const formDataToSend = new FormData();

        // Append all form fields except verificationDoc and agreeToTerms
        Object.keys(formData).forEach((key) => {
            if (key !== "verificationDoc" && key !== "agreeToTerms") {
                formDataToSend.append(key, formData[key]);
            }
        });

        // Append file if exists
        if (formData.verificationDoc) {
            formDataToSend.append("verificationDoc", formData.verificationDoc);
        }

        // Add OTP to the form data
        formDataToSend.append("otp", otp);

        const response = await axios.post("/api/v1/auth/register", formDataToSend, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        if (response.status === 201) {
            toast.success("Registration Successful!");
            setShowOtpModal(false); // Close OTP modal

            // Clear form data
            setFormData({
                email: "",
                password: "",
                name: "",
                address: "",
                latitude: "",
                longitude: "",
                pincode: "",
                role: "individual",
                phoneNumber: "",
                verificationDoc: null,
                agreeToTerms: false,
            });

            // Switch to login view
            setTimeout(() => {
                setIsLogin(true);
            }, 1000);
        }
    } catch (error) {
        toast.error(error.response?.data?.message || "Registration Failed");
    }
};
    
    useEffect(() => {
        AOS.init({ duration: 1000 });
    }, []);

    if (isLoading) {

        return (
            <div className="fixed inset-0 flex items-center justify-center">
                <l-hourglass
                    flex items-center justify-center
                    size="100"
                    bg-opacity="0.1"
                    speed="1.75"
                    color="white"
                ></l-hourglass>
            </div>
        );
    }


    return (
        <div className="max-w-2xl mx-auto p-8 bg-white rounded-lg shadow-xl relative " data-aos="fade-left">
            <div className="flex items-center justify-between mb-6">
                <button
                    onClick={closeModal}
                    className="p-2 bg-gray-200 text-gray-800 rounded-full hover:bg-gray-300 focus:outline-none"
                >
                    <FaArrowLeft className="text-2xl" />
                </button>
            </div>

            <div className="flex flex-col items-center">
                {isLogin ? (
                    <FaPersonCircleCheck className="text-5xl mb-4 text-green-600 animate-bounce hover:scale-110 transition-transform duration-300" />
                ) : (
                    <FaUserPlus className="text-5xl mb-4 text-green-600 animate-bounce hover:scale-110 transition-transform duration-300" />
                )}
                <h2 className="text-4xl font-semibold mb-4 text-green-800">
                    {isLogin ? "Login" : "Register"}
                </h2>
            </div>

            <div className="max-h-[60vh] overflow-y-auto px-6 md:px-12">
                <form className="space-y-4" onSubmit={isLogin ? loginHandler : registerHandler}>

                    {!isLogin && (
                        <>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Name:</label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your name"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Phone Number:</label>
                                <input
                                    type="tel"
                                    name="phoneNumber"
                                    value={formData.phoneNumber}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your phone number"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Address:</label>
                                <textarea
                                    name="address"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your address"
                                    rows="3"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Pincode:</label>
                                <input
                                    type="text"
                                    name="pincode"
                                    value={formData.pincode}
                                    onChange={handleInputChange}
                                    required
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Enter your pincode"
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 font-medium mb-2">Role:</label>
                                <select
                                    name="role"
                                    value={formData.role}
                                    onChange={handleInputChange}
                                    className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="individual">Individual</option>
                                    <option value="restaurant">Restaurant</option>
                                    <option value="ngo">NGO</option>
                                    <option value="volunteer">Volunteer</option>
                                    <option value="volunteer">Catering Service / University mess</option>
                                </select>
                            </div>
                        </>
                    )}

                    {!isLogin && (
                        <>
                            {/* ...existing fields... */}

                            {['restaurant', 'ngo', 'catering/university mess'].includes(formData.role) && (
                                <div className="space-y-2">
                                    <label className="block text-gray-700 font-medium">
                                        Verification Document:
                                        <span className="text-red-500 ml-1">*</span>
                                    </label>
                                    <input
                                        type="file"
                                        onChange={handleFileChange}
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                                    />
                                    <p className="text-xs text-gray-500">
                                        Accepted formats: PDF, JPG, PNG (Max size: 5MB)
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Email:</label>
                        <input
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter your email"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-700 font-medium mb-2">Password:</label>
                        <input
                            type="password"
                            name="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            required
                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                            placeholder="Enter your password"
                        />
                    </div>
                    {!isLogin && (
                        <>
                            {/* ...existing register fields... */}

                            <div className="space-y-4">
                                <label className="block text-gray-700 font-medium mb-2">Location:</label>
                                <button
                                    type="button"
                                    onClick={fetchCurrentLocation}
                                    className="w-full p-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors duration-300 mb-2"
                                >
                                    Fetch Current Location
                                </button>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <input
                                            type="text"
                                            name="latitude"
                                            value={formData.latitude}
                                            readOnly
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                                            placeholder="Latitude"
                                        />
                                    </div>
                                    <div>
                                        <input
                                            type="text"
                                            name="longitude"
                                            value={formData.longitude}
                                            readOnly
                                            className="w-full p-3 border border-gray-300 rounded-lg shadow-sm bg-gray-50"
                                            placeholder="Longitude"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Place this before the Terms & Conditions checkbox */}
                        </>
                    )}


                    {!isLogin && (
                        <div className="flex items-center space-x-2 bg-gray-50 p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition-all duration-300">
                            <input
                                type="checkbox"
                                name="agreeToTerms"
                                checked={formData.agreeToTerms}
                                onChange={handleInputChange}
                                className="w-4 h-4 text-green-600 rounded focus:ring-green-500 cursor-pointer"
                            />
                            <label className="text-sm text-gray-700 cursor-pointer select-none">
                                I agree to the <a href="#" className="text-green-600 hover:text-green-800 font-medium underline">Terms & Conditions</a> and <a href="#" className="text-green-600 hover:text-green-800 font-medium underline">Privacy Policy</a>
                            </label>
                        </div>
                    )}

                    {isLogin && (
                        <div className="text-right">
                            <button
                                type="button"
                                onClick={() => setShowForgotPassword(true)}
                                className="text-black hover:text-black text-sm font-medium"
                            >
                                Forgot Password?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        className="w-full p-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 flex justify-center items-center text-xl transform hover:scale-105 transition-all duration-300"
                    >
                        {isLogin ? (
                            <>
                                <FaLock className="mr-2" />
                                Login
                            </>
                        ) : (
                            <>
                                <FaUserPlus className="mr-2" />
                                Register
                            </>
                        )}
                    </button>

                    <div className="text-center mt-4">
                        <button
                            type="button"
                            onClick={() => setIsLogin(!isLogin)}
                            className="text-black hover:text-black text-sm font-medium hover:underline transition-all duration-300"
                        >
                            {isLogin ? "Don't have an account? Register" : "Already have an account? Login"}
                        </button>
                    </div>
                </form>
            </div>

            {/* OTP Modal */}
        {showOtpModal && (
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full">
                    <h3 className="text-2xl font-bold text-green-800 mb-4">Verify OTP</h3>
                    <p className="text-gray-600 mb-4">Enter the OTP sent to your email:</p>
                    <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-lg mb-4"
                        placeholder="Enter OTP"
                    />
                    <button
                        onClick={verifyOtpAndRegister}
                        className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300"
                    >
                        Verify OTP
                    </button>
                    <button
                        onClick={() => setShowOtpModal(false)}
                        className="w-full p-3 mt-2 bg-gray-300 text-black rounded-lg hover:bg-gray-400 transition-colors duration-300"
                    >
                        Cancel
                    </button>
                </div>
            </div>
        )}

            {showForgotPassword && (
    <div className="fixed inset-0 flex items-center justify-center z-50">
        <div className="bg-white p-6 rounded-lg shadow-xl max-w-md w-full transform transition-all duration-300 scale-100 hover:scale-105">
            <h3 className="text-2xl font-bold text-green-800 mb-4">Forgot Password</h3>
            <p className="text-gray-600 mb-6">
                Please contact the administrator at <span className="font-semibold">nourishai@gmail.com</span> to reset your password.
            </p>
            <button
                onClick={() => setShowForgotPassword(false)}
                className="w-full p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-300"
            >
                Close
            </button>
        </div>
    </div>
)}


            <ToastContainer
                position="top-center"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="light"
            />
        </div>
    );
};

export default Login;