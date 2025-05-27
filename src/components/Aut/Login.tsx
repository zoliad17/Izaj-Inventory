import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    // Simulate authentication
    if (email === "admin@example.com" && password === "password") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "admin");
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: "admin@example.com",
          username: "Admin",
          role: "admin",
        })
      );
      navigate("/dashboard");
    } else if (
      email === "BranchManager@example.com" &&
      password === "password"
    ) {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "branchManager");
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: "BranchManager@example.com",
          username: "Branch Manager",
          role: "branchManager",
        })
      );
      navigate("/dashboard");
    } else if (email === "superAdmin@example.com" && password === "password") {
      localStorage.setItem("isAuthenticated", "true");
      localStorage.setItem("userRole", "superAdmin");
      localStorage.setItem(
        "user",
        JSON.stringify({
          email: "superAdmin@example.com",
          username: "Super Admin",
          role: "superAdmin",
        })
      );
      navigate("dashboard");
    } else {
      alert("Invalid credentials");
    }
  };

  return (
    <div
      className="flex justify-center items-center min-h-screen bg-cover bg-center relative"
      style={{ backgroundImage: "url('/src/assets/image/light1.jpg')" }}
    >
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
                <a
                  className="inline-block align-baseline font-bold text-sm text-amber-500 hover:text-amber-800"
                  href="#"
                >
                  Forgot Password?
                </a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
