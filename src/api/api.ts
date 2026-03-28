import axios from "axios";

// ============================================
// 🔴 BACKEND API URL CONFIGURATION
// ============================================
// Change this based on environment:
//
// FOR LOCALHOST TESTING (CURRENTLY ACTIVE):
// const API = axios.create({
//   baseURL: "http://localhost:5000",
// });

// FOR PRODUCTION DEPLOYMENT:
// Uncomment the line below and comment the localhost line above
const API = axios.create({
  baseURL: "https://aradhay-qr-backend.onrender.com",
});
//
// ⚠️ When deploying frontend:
// 1. Change baseURL to your deployed backend URL
// 2. Make sure backend is deployed first
// 3. Update CORS settings in backend to allow frontend domain
// ============================================

import { auth } from "../auth/firebase";

API.interceptors.request.use(async (req) => {
  try {
    let token = null;

    // ✅ If Firebase is initialized and user is logged in, aggressively get a fresh token
    if (auth.currentUser) {
      token = await auth.currentUser.getIdToken();

      // Keep localStorage in sync so page reloads have a fresh token immediately
      const userStr = localStorage.getItem("focusdesk_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        user.token = token;
        localStorage.setItem("focusdesk_user", JSON.stringify(user));
      }
    } else {
      // Fallback to local storage (covers the first few ms of page load before Firebase restores session)
      const user = JSON.parse(localStorage.getItem("focusdesk_user") || "null");
      token = user?.token;
    }

    if (token) {
      (req.headers as any).Authorization = `Bearer ${token}`;
    }
  } catch (err) {
    // ignore parsing errors
  }

  return req;
});

export default API;
