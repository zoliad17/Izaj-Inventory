import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); // Clear previous errors

    try {
      const response = await fetch("http://localhost:5000/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Login failed");

      const { user, role, branchId } = result;

      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", role);
      localStorage.setItem("user", JSON.stringify(user));
      if (branchId) localStorage.setItem("branchId", branchId);

      // Redirect based on role
      switch (role) {
        case "Branch Manager":
        case "Super Admin":
        default:
          navigate("/dashboard");
          break;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(err instanceof Error ? err.message : "Login failed");
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReset(true);

    try {
      const response = await fetch("http://localhost:5000/api/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const result = await response.json();

      if (!response.ok) throw new Error(result.error || "Failed to send reset email");

      toast.success("If an account with this email exists, a password reset link has been sent.");
      setShowForgotPassword(false);
      setForgotEmail("");

    } catch (err) {
      console.error("Forgot password error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to send reset email");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('/src/assets/image/light1.jpg')" }}
    >
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 5000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
      <div className="w-full max-w-6xl mx-4 flex flex-col md:flex-row items-center justify-between relative z-10">
        <div className="w-full md:w-1/2 flex flex-col justify-center md:justify-start mx-30">
          <h1 className="text-8xl font-bold text-amber-500 text-center md:text-left">
            IZAJ
          </h1>
          <p className="text-5xl font-roboto font-bold text-amber-400 text-center md:text-left mt-4">
            LIGHTING CENTRE
          </p>
        </div>
        <div className="w-full md:w-1/1 max-w-md bg-gradient-to-b from-black/10 to-black/10 backdrop-blur-md rounded-lg shadow-lg p-6 mt-8 md:mt-0">
          <div className="card-body">
            <div className="flex flex-row items-center mx-20 mb-3 p-3">
              <div>
                <img
                  src="/src/assets/image/logo.jpg"
                  alt="Logo"
                  className="w-12 h-12 rounded-full object-cover"
                />
              </div>
              <div className="ml-2">
                <div className="text-xl text-amber-500 font-bold">
                  IZAJ-LIGHTING
                </div>
              </div>
            </div>

            {!showForgotPassword ? (
              <>
                {error && (
                  <div className="mb-4 p-2 bg-red-100 text-red-700 rounded">
                    {error}
                  </div>
                )}
                <form onSubmit={handleLogin}>
                  <div className="mb-4">
                    <label
                      className="block text-amber-500 text-sm font-bold mb-2"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-amber-500 bg-transparent leading-tight focus:outline-none focus:shadow-outline"
                      id="email"
                      type="email"
                      placeholder="Email"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEmail(e.target.value)
                      }
                    />
                  </div>
                  <div className="mb-6">
                    <label
                      className="block text-amber-500 text-sm font-bold mb-2"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-amber-500 bg-transparent leading-tight focus:outline-none focus:shadow-outline"
                      id="password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      className="bg-amber-500 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded focus:outline-none cursor-pointer focus:shadow-outline"
                      type="submit"
                    >
                      Sign In
                    </button>
                    <button
                      type="button"
                      className="inline-block align-baseline font-bold text-sm text-amber-500 hover:text-amber-800"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div>
                <h3 className="text-lg font-bold text-amber-500 mb-4">Reset Password</h3>
                <p className="text-sm text-gray-300 mb-4">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-4">
                    <label
                      className="block text-amber-500 text-sm font-bold mb-2"
                      htmlFor="forgotEmail"
                    >
                      Email
                    </label>
                    <input
                      className="shadow appearance-none border rounded w-full py-2 px-3 text-amber-500 bg-transparent leading-tight focus:outline-none focus:shadow-outline"
                      id="forgotEmail"
                      type="email"
                      placeholder="Enter your email"
                      value={forgotEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForgotEmail(e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <button
                      type="button"
                      className="text-amber-500 hover:text-amber-800 text-sm font-bold"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Back to Login
                    </button>
                    <button
                      className="bg-amber-500 hover:bg-amber-700 text-white font-bold py-2 px-4 rounded focus:outline-none cursor-pointer focus:shadow-outline"
                      type="submit"
                      disabled={sendingReset}
                    >
                      {sendingReset ? "Sending..." : "Send Reset Link"}
                    </button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
