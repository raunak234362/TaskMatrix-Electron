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
    if (userDetail?.id) {
      sessionStorage.setItem("userId", userDetail.id);
    }
    if (userDetail?.username) {
      sessionStorage.setItem("username", userDetail.username);
    }
    if (userDetail?.firstName) {
      sessionStorage.setItem("firstName", userDetail.firstName);
    }
    if (userDetail?.lastName) {
      sessionStorage.setItem("lastName", userDetail.lastName);
    }
    if (userDetail?.role) {
      sessionStorage.setItem("userRole", userDetail.role);
    }
    if (userDetail?.designation) {
      sessionStorage.setItem("designation", userDetail.designation);
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
    toast.success("Login Successful");
    console.log("Login Successful:", responseData);
  };

  // Function for login and OTP verification check
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

  // Function for handling OTP verification
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
        <div className="flex items-center justify-center p-4 md:p-6">
          <div className="flex items-center justify-center p-6 md:p-12 shadow-2xl shadow-green-950/20 bg-white/90 backdrop-blur-sm border-2 border-white w-full max-w-lg">
            <img src={LOGO} alt="Logo" className="w-full h-auto" />
          </div>
        </div>

        {/* Login form */}
        <div className="flex items-center md:bg-white/10 md:backdrop-blur-xl justify-center p-4 md:p-8">
          <div className="bg-white/95 w-full max-w-[400px] sm:max-w-[500px] min-h-[450px] sm:min-h-[500px] border border-green-900/10 p-8 sm:p-12 md:p-14 shadow-2xl shadow-green-950/20 flex flex-col justify-between">
            {/* Welcome Message */}
            <div className="mb-6 sm:mb-8 text-center">
              <h1 className="text-2xl sm:text-3xl text-black font-normal  uppercase">
                Welcome to
              </h1>
              <div className="text-3xl sm:text-4xl md:text-[42px] text-green-600 font-normal  uppercase leading-tight mt-1 sm:mt-2">
                <div>Task Matrix</div>
              </div>
               <span className="text-sm text-black font-semibold tracking-widest uppercase">
                version: 1.3.0
              </span>
              <p className="text-xs sm:text-sm text-black font-semibold uppercase mt-4 sm:mt-6">
                {showOTP ? "Verify your identity" : "Please login to continue"}
              </p>
            </div>

            {!showOTP ? (
              <form onSubmit={handleSubmit(Submit)} className="flex flex-col w-full gap-5">
                <div>
                  <Input
                    label="USERNAME:"
                    labelClassName="text-sm font-semibold text-black tracking-wider mb-1"
                    placeholder="USERNAME"
                    className=" border-black py-2.5 px-3.5 text-sm bg-primary/20 placeholder:text-gray-900 placeholder:text-xs placeholder:tracking-wider"
                    type="text"
                    {...register("username", {
                      required: "Username is required",
                    })}
                  />
                </div>

                <div>
                  <Input
                    label="PASSWORD:"
                    labelClassName="text-sm font-semibold text-black tracking-wider mb-1"
                    placeholder="PASSWORD"
                    type="password"
                    className=" border-black  py-2.5 px-3.5 text-sm bg-primary/20 placeholder:text-gray-900 placeholder:text-xs placeholder:tracking-wider"
                    {...register("password", {
                      required: "Password is required",
                    })}
                  />
                </div>

                <div className="mt-4 sm:mt-6">
                  <Button
                    type="submit"
                    disabled={isLoggingIn}
                    className="w-full py-2.5 bg-primary hover:bg-primary/80 text-black border border-black transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center cursor-pointer font-bold tracking-wider text-sm sm:text-base uppercase"
                  >
                    {isLoggingIn ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Logging in...
                      </>
                    ) : (
                      "Login"
                    )}
                  </Button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleVerify} className="flex flex-col w-full gap-5 items-center">
                <p className="text-xs text-gray-600 text-center mb-1">
                  Enter the 6-digit OTP sent to your registered email address.
                </p>
                <div className="flex gap-2 justify-center">
                  {otp.map((data, index) => {
                    return (
                      <input
                        className="w-10 h-12 text-center text-lg font-bold border border-gray-300 rounded-[4px] focus:border-green-600 focus:ring-green-600 outline-none"
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
                    className="w-full py-2.5 rounded-[4px] bg-[#ebf5ea] hover:bg-[#dcecdb] text-black border border-black transition-all duration-200 shadow-sm hover:shadow-md disabled:opacity-50 flex items-center justify-center cursor-pointer font-bold tracking-wider text-sm sm:text-base uppercase"
                  >
                    {isVerifying ? "Verifying..." : "Verify OTP"}
                  </Button>
                </div>
                
                <button
                  type="button"
                  onClick={() => setShowOTP(false)}
                  className="mt-2 text-green-600 hover:text-green-700 underline text-xs font-medium cursor-pointer uppercase tracking-wider"
                >
                  Back to Login
                </button>
              </form>
            )}

            {/* Version Footer */}
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
