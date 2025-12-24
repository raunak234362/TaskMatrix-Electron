import axios from "axios";

const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});
console.log("API base URL:", instance.defaults.baseURL);
instance.interceptors.request.use((config) => {
  // Ensure headers exists
  config.headers = config.headers ?? {};

  // Add token if available
  const token = sessionStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export default instance;
