import React, { useState } from "react";
import { X, Lock, Loader2 } from "lucide-react";
import Button from "../fields/Button";
import { toast } from "react-toastify";
import AuthService from "../../api/auth";


const ChangePasswordModal = ({
    id,
    onClose,
    onSuccess,
}) => {
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!newPassword || !confirmPassword) {
            setError("Please fill in all fields");
            return;
        }

        if (newPassword !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (newPassword.length < 6) {
            setError("Password must be at least 6 characters long");
            return;
        }

        try {
            setLoading(true);
            const token = sessionStorage.getItem("token") || "";

            await AuthService.changePassword({
                id,
                token,
                newPassword,
                username: "", // Not needed for this endpoint but required by interface
            });

            toast.success("Password changed successfully");
            onSuccess();
            onClose();
        } catch (err) {
            console.error("Change password error:", err);
            setError(
                err.response?.data?.message || "Failed to change password. Please try again."
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden relative animate-in fade-in zoom-in-95 duration-200">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                <div className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 bg-green-100 rounded-full text-green-600">
                            <Lock className="w-6 h-6" />
                        </div>
                        <div>
                            <h2 className="text-xl  text-gray-800">Change Password</h2>
                            <p className="text-sm text-gray-500">
                                Enter a new secure password
                            </p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg border border-red-100">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                New Password
                            </label>
                            <input
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-green-500 transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Confirm Password
                            </label>
                            <input
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-3 py-2 border border-blue-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-green-500 transition-all font-mono"
                                placeholder="••••••••"
                            />
                        </div>

                        <div className="flex justify-end gap-3 result pt-2">
                            <Button
                                type="button"
                                onClick={onClose}
                                className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 rounded-lg"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 rounded-lg disabled:opacity-70 flex items-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" /> Changing...
                                    </>
                                ) : (
                                    "Change Password"
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePasswordModal;
