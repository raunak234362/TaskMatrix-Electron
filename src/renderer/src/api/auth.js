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
      alert(error)
      console.log('Error while sign-in', error)
    }
  }

   static async changePassword({ id, token, newPassword }) {
    const userData = {
      id,
      token,
      newPassword,
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
}

export default AuthService
