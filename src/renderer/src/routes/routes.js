import Login from "../pages/Login";
import DashboardLayout from "../layout/DashboardLayout";
import RequireAuth from "../middleware/RequireAuth";
import { WBTDashboard } from "../components";
import ProfilePage from "../pages/ProfilePage";
import { ChatPage } from "../pages/ChatPage";
import ChangePasswordPage from "../pages/ChangePasswordPage";
import RFIPage from "../pages/RFIPage";
import EstimationPage from "../pages/EstimationPage";

const routes = [
  { path: "/", Component: Login },
  { path: "/change-password", Component: ChangePasswordPage },
  {
    Component: RequireAuth,
    children: [
      {
        path: "/dashboard",
        Component: DashboardLayout,
        children: [
          { path: "", Component: WBTDashboard },
          { path: "profile", Component: ProfilePage },
          { path: "estimation", Component: EstimationPage },
          { path: "chats", Component: ChatPage },
          { path: "rfi", Component: RFIPage },
        ],
      },
    ],
  },
];
export default routes;
