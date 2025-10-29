export const API_BASE_URL =
  // Allow overriding the API URL at build/runtime via Vite env var
  (import.meta.env.VITE_API_URL as string) ||
  (import.meta.env.MODE === "development"
    ? "http://localhost:5000" // local dev
    : "https://izaj-inventory.onrender.com"); // deployed backend
