/* eslint-disable @typescript-eslint/no-explicit-any */

import { useSelector } from "react-redux";
import {
  Mail,
  Phone,
  MapPin,
  UserCog,
  User,
  Shield,
  Edit2,
} from "lucide-react";
import { FiPhoneCall } from "react-icons/fi";
import Button from "../fields/Button";
import { useState } from "react";
import EditEmployee from "../manageTeam/employee/EditEmployee";
import ChangePasswordModal from "./ChangePasswordModal";
import Service from "../../api/Service";
import { useDispatch } from "react-redux";
import { setUserData } from "../../store/userSlice";
import { toast } from "react-toastify";

const Profile = () => {
  const dispatch = useDispatch();
  const userRole = sessionStorage.getItem('userRole')?.toLowerCase() || ''
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isChangePasswordModalOpen, setIsChangePasswordModalOpen] = useState(false);

  // Get user data from Redux
  const user = useSelector((state) => state.userInfo.userDetail);

  const handleUpdateSuccess = async () => {
    try {
      const response = await Service.GetUserByToken();
      if (response?.data?.user) {
        dispatch(setUserData(response.data.user));
        toast.success("Profile updated successfully");
      }
    } catch (error) {
      console.error("Failed to refresh user data:", error);
      toast.error(
        "Profile updated, but failed to refresh view. Please reload."
      );
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-screen text-gray-700">
        Loading user details...
      </div>
    );
  }

  return (
    <div className="flex justify-center items-start">
      <div className="w-full space-y-5 bg-white shadow-lg rounded-2xl p-8 border border-gray-100">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center text-3xl font-semibold text-green-600">
            {user.firstName?.[0] || "U"}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-700">
              {user.firstName} {user.lastName}
            </h2>
            <p className="text-gray-700 flex items-center gap-1">
              <UserCog className="w-4 h-4" /> {user.designation || "—"}
            </p>
          </div>
        </div>

        {/* Basic Info */}
        <div className="grid sm:grid-cols-2 gap-6 mb-8">
          <div>
            <p className="text-gray-700 text-sm">Username</p>
            <p className="font-semibold text-gray-700">{user.username}</p>
          </div>

          <div>
            <p className="text-gray-700 text-sm">Email</p>
            <p className="flex items-center gap-2 text-gray-700 font-medium">
              <Mail className="w-4 h-4 text-green-500" />
              {user.email}
            </p>
          </div>

          <div>
            <p className="text-gray-700 text-sm">Phone</p>
            <p className="flex items-center gap-2 text-gray-700 font-medium">
              <Phone className="w-4 h-4 text-green-500" />
              {user.phone || "N/A"}
              {user.extension && (
                <span className="text-gray-700 text-sm ml-1">
                  (Ext: {user.extension})
                </span>
              )}
            </p>
          </div>
          <div>
            <p className="text-gray-700 text-sm">Landline</p>
            <p className="flex items-center gap-2 text-gray-700 font-medium">
              <FiPhoneCall className="w-4 h-4 text-green-500" />
              {user.phone || "N/A"}
            </p>
          </div>

          <div>
            <p className="text-gray-700 text-sm">Role</p>
            <p className="flex items-center gap-2 text-gray-700 font-medium">
              <Shield className="w-4 h-4 text-green-500" />
              {user.role}
            </p>
          </div>
        </div>

        {/* Address Section */}
        <div className="border-t border-gray-200 pt-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-2 flex items-center gap-2">
            <MapPin className="w-5 h-5 text-green-600" /> Address
          </h3>
          <p className="text-gray-700 leading-relaxed">
            {user.address ? (
              <>
                {user.address}, {user.city}, {user.state}, {user.zipCode},{" "}
                {user.country}
              </>
            ) : (
              "No address information"
            )}
          </p>
        </div>

        {/* Account Info */}
        <div className="border-t border-gray-200 pt-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <User className="w-5 h-5 text-green-600" /> Account Details
          </h3>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* <div>
              <p className="text-gray-700 text-sm">Account Status</p>
              <span
                className={`px-3 py-1 text-sm font-semibold rounded-full ${
                  user.isActive
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {user.isActive ? "Active" : "Inactive"}
              </span>
            </div> */}

            <div>
              <p className="text-gray-700 text-sm">Created At</p>
              <p className="text-gray-700 font-medium">
                {new Date(user.createdAt).toLocaleString()}
              </p>
            </div>

            <div>
              <p className="text-gray-700 text-sm">Last Updated</p>
              <p className="text-gray-700 font-medium">
                {new Date(user.updatedAt).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
        <div className="border-t border-gray-200 pt-6">
          <div className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            {userRole === "admin" || userRole === "human_resource" && (
              <>
                <Edit2 className="w-5 h-5 text-green-600" /> Update Detail{" "}
                <Button onClick={() => setIsEditModalOpen(true)}>Update </Button>
              </>
            )}
            <Button onClick={() => setIsChangePasswordModalOpen(true)}>Change Password </Button>
          </div>
        </div>

        {isEditModalOpen && (
          <EditEmployee
            employeeData={user}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleUpdateSuccess}
          />
        )}

        {isChangePasswordModalOpen && (
          <ChangePasswordModal
            id={user.id}
            onClose={() => setIsChangePasswordModalOpen(false)}
            onSuccess={() => setIsChangePasswordModalOpen(false)}
          />
        )}
      </div>
    </div>
  );
};

export default Profile;
