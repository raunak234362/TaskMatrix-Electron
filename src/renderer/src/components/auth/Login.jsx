import React, { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import AuthService from "../../api/auth";
import Background from "../../assets/Green Banana Leaf Pattern Reminder Facebook Post(1).jpg";
import LOGO from "../../assets/logo.png";
import Input from "../fields/input";
import Button from "../fields/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, setUserData } from "../../store/userSlice";

const Login = () => {
  const { register, handleSubmit, setValue } = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchOSUser = async () => {
      try {
        if (window.api && window.api.getOSUser) {
          const osUser = await window.api.getOSUser();
          if (osUser) {
            setValue("username", osUser, { 
              shouldValidate: true,
              shouldDirty: true,
              shouldTouch: true
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch OS user:", error);
      }
    };
    fetchOSUser();
  }, [setValue]);

  const [showOTP, setShowOTP] = useState(false);
  const [challengeToken, setChallengeToken] = useState("");
  const [otp, setOtp] = useState(new Array(6).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleOtpChange = (element, index) => {
    if (isNaN(element.value)) return false;

    setOtp([...otp.map((d, idx) => (idx === index ? element.value : d))]);

    // Focus next input
    if (element.nextSibling) {
      element.nextSibling.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace") {
      if (!otp[index] && e.target.previousSibling) {
        e.target.previousSibling.focus();
      }
    }
  };

  const processLoginSuccess = (token, userDetail, responseData) => {
    if (!token) {
      throw new Error("Invalid Credentials: Token not found in response");
    }

    sessionStorage.setItem("token", token);
    if (userDetail?.role) {
      sessionStorage.setItem("userRole", userDetail.role);
    }

    dispatch(login(token));
    if (userDetail) {
      dispatch(setUserData(userDetail));
    }

    const role = userDetail?.role?.toLowerCase() || "";
    if (role === "sales" || role === "sales_manager") {
      navigate("/dashboard/sales");
    } else if (role === "connection_designer_engineer") {
      navigate("/dashboard/designer");
    } else {
      navigate("/dashboard");
    }
    console.log("Login Successful:", responseData);
  };

  const Submit = async (data) => {
    try {
      setIsLoggingIn(true);
      const userLogin = await AuthService.login(data);

      if (userLogin?.requiresVerification || userLogin?.data?.requiresVerification) {
        const token = userLogin?.challengeToken || userLogin?.data?.challengeToken;
        const msg = userLogin?.message || userLogin?.data?.message || "A verification challenge has been sent to your registered email address.";
        setChallengeToken(token);
        setShowOTP(true);
        toast.info(msg);
        return;
      }

      const token = userLogin?.data?.token || userLogin?.token;
      const userDetail = userLogin?.data?.user || userLogin?.user;
      processLoginSuccess(token, userDetail, userLogin);

    } catch (error) {
      console.error("Error While Logging in:", error);
      if (error?.response?.status === 202) {
        const responseData = error.response.data;
        if (responseData?.requiresVerification) {
          const token = responseData.challengeToken;
          const msg = responseData.message || "A verification challenge has been sent to your registered email address.";
          setChallengeToken(token);
          setShowOTP(true);
          toast.info(msg);
          return;
        }
      }
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      toast.error(errorMessage);
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    if (otpValue.length !== 6) {
      toast.warning("Please enter a 6-digit OTP.");
      return;
    }
    try {
      setIsVerifying(true);
      const verifyResponse = await AuthService.verifyChallenge({ otp: otpValue, challengeToken });
      
      const token = verifyResponse?.data?.token || verifyResponse?.token;
      const userDetail = verifyResponse?.data?.user || verifyResponse?.user;

      processLoginSuccess(token, userDetail, verifyResponse);
    } catch (error) {
      console.error("Error While Verifying:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Verification failed. Please check your OTP.";
      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="relative min-h-screen">
      {/* Background with blur */}
      <img
        src={Background}
        alt="background"
        className="absolute inset-0 h-full w-full object-cover blur-sm z-0"
      />

      <div className="relative z-10 grid w-screen min-h-screen grid-cols-1 md:grid-cols-2 overflow-x-hidden">
        {/* Logo section */}
        <div className="flex items-center justify-center md:min-h-screen p-6">
          <div className="flex items-center justify-center p-6 md:p-16 shadow-2xl shadow-green-950/20 bg-white/90 backdrop-blur-sm border-4 border-white rounded-[6px] w-full max-w-md">
            <img src={LOGO} alt="Logo" className="w-full h-auto" />
          </div>
        </div>

        {/* Login form */}
        <div className="flex items-center md:bg-white/10 md:backdrop-blur-xl justify-center p-6 md:p-0">
          <div className="bg-white/95 h-fit w-full max-w-lg md:w-3/4 lg:w-2/3 rounded-[6px] border border-green-900/10 p-8 md:p-12 shadow-2xl shadow-green-950/20">
            {/* Welcome Message */}
            <div className="mb-8">
              <p className="text-center text-4xl md:text-5xl text-gray-700 font-light leading-tight">
                Welcome to <br />
                <span className=" text-green-700">Task Matrix <span className=" text-green-700 text-xs">verion: 1.1.0</span></span>
              </p>
              <p className="text-center text-lg text-gray-500 mt-4">
                {showOTP ? "Verify your identity" : "Please login to continue"}
              </p>
            </div>

            {!showOTP ? (
              <form onSubmit={handleSubmit(Submit)} className="flex flex-col w-full gap-6">
                <div>
                  <Input
                    label="Username"
                    placeholder="USERNAME"
                    className="rounded-[6px] border-gray-200 focus:border-green-600 focus:ring-green-600"
                    type="text"
                    {...register("username", {
                      required: "Username is required",
                    })}
                  />
                </div>

                <div>
                  <Input
                    label="Password"
                    placeholder="PASSWORD"
                    type="password"
                    className="rounded-[6px] border-gray-200 focus:border-green-600 focus:ring-green-600"
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                </div>

                <div className="mt-4">
                  <Button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full text-2xl py-4 rounded-[6px] bg-green-600 hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-600/30 text-white disabled:opacity-50 flex items-center justify-center"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-3 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="flex flex-col w-full gap-6 items-center">
                <p className="text-sm text-gray-600 text-center mb-2">
                  Enter the 6-digit OTP sent to your registered email address.
                </p>
                <div className="flex gap-2 justify-center">
                  {otp.map((data, index) => {
                    return (
                      <input
                        className="w-12 h-14 text-center text-xl font-bold border border-gray-300 rounded-[6px] focus:border-green-600 focus:ring-green-600 outline-none"
                        type="text"
                        name="otp"
                        maxLength="1"
                        key={index}
                        value={data}
                        onChange={(e) => handleOtpChange(e.target, index)}
                        onFocus={(e) => e.target.select()}
                        onKeyDown={(e) => handleKeyDown(e, index)}
                      />
                    );
                  })}
                </div>

                <div className="mt-4 w-full">
                  <Button
                    type="submit"
                    disabled={isVerifying}
                    className="w-full text-2xl py-4 rounded-[6px] bg-green-600 hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-600/30 text-white disabled:opacity-50"
                  >
                    {isVerifying ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowOTP(false)}
                  className="mt-2 text-green-600 hover:text-green-700 underline text-sm font-medium"
                >
                  Back to Login
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
