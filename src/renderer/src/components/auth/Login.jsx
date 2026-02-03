import { useForm } from "react-hook-form";
import AuthService from "../../api/auth";
import Background from "../../assets/Green Banana Leaf Pattern Reminder Facebook Post(1).jpg";
import LOGO from "../../assets/logo.png";
import Input from "../fields/input";
import Button from "../fields/Button";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { login, setUserData } from "../../store/userSlice";

const Login = () => {
  const { register, handleSubmit } = useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const Submit = async (data) => {
    try {
      const userLogin = await AuthService.login(data);
      const token = userLogin?.data?.token || userLogin?.token;
      const userDetail = userLogin?.data?.user || userLogin?.user;

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
      console.log("Login Successful:", userLogin);
    } catch (error) {
      console.error("Error While Logging in:", error);
      const errorMessage =
        error?.response?.data?.message ||
        error.message ||
        "Login failed. Please check your credentials.";
      alert(errorMessage);
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
                <span className="font-bold text-green-700">Task Matrix</span>
              </p>
              <p className="text-center text-lg text-gray-500 mt-4">
                Please login to continue
              </p>
            </div>

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
                  className="w-full text-2xl font-bold py-4 rounded-[6px] bg-green-600 hover:bg-green-700 transition-all duration-300 shadow-lg shadow-green-600/30 text-white"
                >
                  Login
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
