import Background from "../assets/background-image.jpg";

import { Login as LoginTemp } from "../components/index";
const Login = () => {
  return (
    <div className="w-screen h-screen relative">
      <img
        src={Background}
        alt="background"
        className="absolute inset-0 h-full w-full object-cover blur-[8px] z-0"
      />

      {<LoginTemp />}
    </div>
  );
};

export default Login;
