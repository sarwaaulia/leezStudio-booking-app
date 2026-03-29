import axios from 'axios';

const api = axios.create({
  // menggunakan variabel environment yang simpel agar fleksibel
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080',
  withCredentials: true,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // handle global error handling
    const message = error.response?.data?.message || "Internal server error";
    
    if (error.response?.status === 401) {
      localStorage.removeItem("token");
      window.location.href = "/login";
    }
    
    return Promise.reject(error);
  }
);

export default api;