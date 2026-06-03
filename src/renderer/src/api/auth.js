import api from './api'

class AuthService {
  static async login({ username, password }) {
    console.log(username, password)
    const userData = {
      username: username.toUpperCase(),
      password
    }

    try {
      const response = await api.post(`auth/login`, userData, {
        headers: {
          'Content-Type': 'application/json'
        }
      })
      console.log('response of Sign-in:-', response)
      return response?.data
    } catch (error) {
      console.log('Error while sign-in', error)
      throw error;
    }
  }

   static async changePassword({ id, token, newPassword, purpose }) {
    const userData = {
      id,
      token,
      newPassword,
      purpose: purpose || "password_reset",
    };

    console.log("Sending login request with payload:", userData);

    try {
      const response = await api.patch(`auth/reset-password`, userData);
      console.log("response of Sign-in:-", response);
      return response?.data;
    } catch (error) {
      console.error(
        "Error while sign-in:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }
  static async updatePassword({ currentPassword, newPassword }) {
    const userData = {
      currentPassword,
      newPassword
    };

    try {
      const response = await api.patch(`auth/change-password`, userData);
      return response?.data;
    } catch (error) {
      console.error(
        "Error while changing password:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }
  static async verifyChallenge({ otp, challengeToken }) {
    try {
      const response = await api.post(`auth/verify-challenge`, { otp, challengeToken });
      return response?.data;
    } catch (error) {
      console.error(
        "Error while verifying challenge:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }
  static async getMeAnalytics() {
    try {
      const response = await api.get(`auth/analytics/me`);
      return response?.data;
    } catch (error) {
      console.error(
        "Error while fetching me analytics:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }

  static async getAdminAnalytics() {
    try {
      const response = await api.get(`auth/analytics/admin`);
      return response?.data;
    } catch (error) {
      console.error(
        "Error while fetching admin analytics:",
        error?.response?.data || error.message || error
      );
      throw error;
    }
  }
}

export default AuthService;
