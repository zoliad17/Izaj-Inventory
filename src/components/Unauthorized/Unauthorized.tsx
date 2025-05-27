import { useNavigate } from "react-router-dom";

function Unauthorized() {
  const navigate = useNavigate();

  // Function to handle navigation to the dashboard
  const handleGoToDashboard = () => {
    navigate("/dashboard");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-center p-4">
      {/* Icon or Image */}
      <img
        src="https://cdn-icons-png.flaticon.com/512/1176/1176437.png" // Example unauthorized icon
        alt="Unauthorized"
        className="w-24 h-24 mb-6"
      />

      {/* Title */}
      <h1 className="text-4xl font-bold text-gray-800 mb-4">
        Unauthorized Access
      </h1>

      {/* Description */}
      <p className="text-lg text-gray-600 mb-8">
        You don't have permission to view this page. Please contact your
        administrator if you believe this is a mistake.
      </p>

      {/* Button to Navigate to Dashboard */}
      <button
        onClick={handleGoToDashboard}
        className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition duration-300"
      >
        Go to Dashboard
      </button>
    </div>
  );
}

export default Unauthorized;
