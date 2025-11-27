import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import { useAuth } from "../../contexts/AuthContext";
import { getAppVersion } from "../../utils/versionUtils";
import light1 from "@/assets/image/light1.jpg";
import logo from "@/assets/image/logo.jpg";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [sendingReset, setSendingReset] = useState(false);
  const [appVersion, setAppVersion] = useState("0.0.0");
  const navigate = useNavigate();
  const { login, isAuthenticated, isLoading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      navigate("/dashboard");
    }
  }, [isAuthenticated, navigate]);

  // Load app version
  useEffect(() => {
    const loadVersion = async () => {
      const version = await getAppVersion();
      setAppVersion(version);
    };
    loadVersion();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const result = await login(email, password);

    if (!result.success) {
      setError(result.error || "Login failed");
    }
    // Navigation is handled by useEffect when isAuthenticated changes
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingReset(true);

    try {
      // Import api here to avoid circular dependency
      const { api } = await import("../../utils/apiClient");
      const { error } = await api.forgotPassword(forgotEmail);

      if (error) {
        toast.error(error);
        return;
      }

      toast.success(
        "If an account with this email exists, a password reset link has been sent."
      );
      setShowForgotPassword(false);
      setForgotEmail("");
    } catch (err) {
      toast.error("Failed to send reset email. Please try again.");
    } finally {
      setSendingReset(false);
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: `url(${light1})` }}
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
      <div className="absolute inset-0 bg-black/40 backdrop-blur-xs"></div>

      <div className="w-full max-w-6xl flex flex-col lg:flex-row items-center justify-between gap-12 relative z-10 mx-4">
        {/* Brand Section - Neumorphic Card */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start text-center lg:text-left">
          <div className=" p-8  w-full max-w-md">
            <div className="flex flex-col items-center mb-6">
              <div className="bg-white/30 dark:bg-gray-700/30 backdrop-blur-sm rounded-full p-4 shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.2)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(60,60,60,0.1)] mb-6 border border-white/20">
                <img
                  src={logo}
                  alt="Logo"
                  className="w-20 h-20 rounded-full object-cover"
                />
              </div>
              <h1 className="text-7xl font-bold text-amber-400 mb-2 drop-shadow-lg">
                IZAJ
              </h1>
              <p className="text-3xl font-roboto font-bold text-amber-300 drop-shadow-md">
                LIGHTING CENTRE
              </p>
            </div>

            <p className="text-white dark:text-gray-200 text-center mt-4 drop-shadow-md">
              Professional Inventory Management Solution
            </p>

            <div className="mt-6 p-4 bg-white/10 dark:bg-gray-700/20 rounded-xl backdrop-blur-sm border border-white/20 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.1)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.3),inset_-2px_-2px_5px_rgba(60,60,60,0.1)]">
              <p className="text-white/90 dark:text-gray-100 text-center italic text-sm">
                "Efficiency is doing things right; effectiveness is doing the
                right things."
              </p>
              <p className="text-amber-300 text-center text-xs mt-2">
                - Peter Drucker
              </p>
            </div>
          </div>
        </div>

        {/* Login Form - Neumorphic Card */}
        <div className="w-full lg:w-1/2 flex justify-center">
          <div className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-md rounded-3xl p-8 shadow-[10px_10px_20px_rgba(0,0,0,0.1),-10px_-10px_20px_rgba(255,255,255,0.2)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-10px_-10px_20px_rgba(60,60,60,0.1)] w-full max-w-md border border-white/20">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-amber-400 mb-2 drop-shadow-md">
                Welcome Back
              </h2>
              <p className="text-white/80 dark:text-gray-200">
                Sign in to your account
              </p>
            </div>

            {!showForgotPassword ? (
              <>
                {error && (
                  <div className="mb-6 p-4 bg-red-500/20 text-red-100 rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.1)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)] border border-red-500/30">
                    {error}
                  </div>
                )}
                <form onSubmit={handleLogin}>
                  <div className="mb-6">
                    <label
                      className="block text-amber-300 text-sm font-bold mb-2 drop-shadow-md"
                      htmlFor="email"
                    >
                      Email
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-white/20 dark:bg-gray-700/20 text-white placeholder-white/50 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.1)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)] focus:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)] dark:focus:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(40,40,40,0.5)] transition-shadow duration-300 border border-white/20"
                      id="email"
                      type="email"
                      placeholder="izaj@email.com"
                      value={email}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setEmail(e.target.value)
                      }
                    />
                  </div>
                  <div className="mb-6">
                    <label
                      className="block text-amber-300 text-sm font-bold mb-2 drop-shadow-md"
                      htmlFor="password"
                    >
                      Password
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-white/20 dark:bg-gray-700/20 text-white placeholder-white/50 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.1)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)] focus:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)] dark:focus:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(40,40,40,0.5)] transition-shadow duration-300 border border-white/20"
                      id="password"
                      type="password"
                      placeholder="••••••••"
                      value={password}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setPassword(e.target.value)
                      }
                    />
                  </div>
                  <div className="flex justify-center mb-6">
                    <button
                      type="button"
                      className="text-amber-300 hover:text-amber-100 text-sm font-bold drop-shadow-md"
                      onClick={() => setShowForgotPassword(true)}
                    >
                      Forgot Password?
                    </button>
                  </div>
                  <button
                    className="w-full bg-amber-500/80 hover:bg-amber-500 text-white font-bold py-3 px-4 rounded-xl shadow-[6px_6px_12px_rgba(0,0,0,0.2),-6px_-6px_12px_rgba(255,255,255,0.1)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(60,60,60,0.1)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)] dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(60,60,60,0.1)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-amber-400/30"
                    type="submit"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing In..." : "Sign In"}
                  </button>
                </form>
              </>
            ) : (
              <div>
                <h3 className="text-2xl font-bold text-amber-400 mb-4 text-center drop-shadow-md">
                  Reset Password
                </h3>
                <p className="text-white/80 dark:text-gray-200 mb-6 text-center">
                  Enter your email address and we'll send you a link to reset
                  your password.
                </p>
                <form onSubmit={handleForgotPassword}>
                  <div className="mb-6">
                    <label
                      className="block text-amber-300 text-sm font-bold mb-2 drop-shadow-md"
                      htmlFor="forgotEmail"
                    >
                      Email
                    </label>
                    <input
                      className="w-full px-4 py-3 rounded-xl bg-white/20 dark:bg-gray-700/20 text-white placeholder-white/50 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.1)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)] focus:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)] dark:focus:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(40,40,40,0.5)] transition-shadow duration-300 border border-white/20"
                      id="forgotEmail"
                      type="email"
                      placeholder="your@email.com"
                      value={forgotEmail}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        setForgotEmail(e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <button
                      type="button"
                      className="w-full sm:w-auto text-amber-300 hover:text-amber-100 font-bold py-3 px-6 rounded-xl shadow-[inset_2px_2px_5px_rgba(0,0,0,0.1),inset_-2px_-2px_5px_rgba(255,255,255,0.1)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)] dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.8),inset_-4px_-4px_8px_rgba(40,40,40,0.5)] transition-all duration-300 border border-amber-400/20"
                      onClick={() => setShowForgotPassword(false)}
                    >
                      Back to Login
                    </button>
                    <button
                      className="w-full sm:w-auto bg-amber-500/80 hover:bg-amber-500 text-white font-bold py-3 px-6 rounded-xl shadow-[6px_6px_12px_rgba(0,0,0,0.2),-6px_-6px_12px_rgba(255,255,255,0.1)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(60,60,60,0.1)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.2),inset_-4px_-4px_8px_rgba(255,255,255,0.1)] dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(60,60,60,0.1)] transition-all duration-300 border border-amber-400/30"
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

      {/* Static Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-4 text-right m-3 text-white/70 text-sm z-20">
        <p>
          Version {appVersion} |{" "}
          <a
            href="#"
            className="text-amber-300 hover:text-amber-100 transition-colors"
          >
            Check for Updates
          </a>
        </p>
      </div>
    </div>
  );
}

export default Login;
