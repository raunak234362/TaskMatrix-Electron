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
}

export default AuthService
