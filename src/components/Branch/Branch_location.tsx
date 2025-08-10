import { useNavigate } from "react-router-dom";
import { LocationMarkerIcon, PhoneIcon } from "@heroicons/react/outline";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useEffect, useState } from "react";
import { supabase } from "../../../backend/Server/Supabase/supabase";

// Define interface for Branch data
interface Branch {
  id: number;
  name: string,
  image: string | null;
  location: string;
  address: string | null;
  contact: string | null;
  description: string | null;
}

// Define type for the user object (matching your sidebar)
interface User {
  email?: string;
  username?: string;
  role?: { role_name: string };
  branch_id?: number;
}

function BranchLocation() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  // Get user data from localStorage (same as in sidebar)
  const userString = localStorage.getItem("user");
  const user: User | null = userString ? JSON.parse(userString) : null;

  // State for branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase
        .from("branch")
        .select("id, location, address");

      if (error) {
        console.error("Failed to fetch branches:", error);
        setBranches([]);
        setFilteredBranches([]);
      } else {
        // Map to Branch interface
        const branchData: Branch[] = (data || []).map((b: any) => ({
          id: b.id,
          name: b.name || null,
          image: b.image || null,
          location: b.location,
          contact: b.contact || null,
          description: b.description || null,
          address: b.address || null,
        }));

        setBranches(branchData);
      }
    };

    fetchBranches();
  }, []);

  // Filter branches based on user's branch_id
  useEffect(() => {
    if (branches.length > 0) {
      let filtered = branches;

      // If user has a branch_id, filter out their own branch
      if (user?.branch_id) {
        filtered = branches.filter(branch => branch.id !== user.branch_id);
      }

      setFilteredBranches(filtered);
    }
  }, [branches, user?.branch_id]);

  return (
    <div
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4`}
    >
      <div className="p-3 bg-white">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
          <h5 className="text-xl font-bold mt-0">Active Branch</h5>
          {user?.branch_id && (
            <p className="text-sm text-gray-500 mt-2 sm:mt-0">
              Showing branches available for transfer
            </p>
          )}
        </div>

        {/* Show message if no branches available */}
        {filteredBranches.length === 0 ? (
          <div className="mt-5 p-6 text-center text-gray-500">
            <p>No other branches available to view.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
            {filteredBranches.map((branch) => (
              <div key={branch.id} className="col flex flex-col">
                <div className="card h-full bg-white rounded-lg shadow-md overflow-hidden outline-1 flex flex-col">
                  {/* Placeholder image if null */}
                  <img
                    src={branch.image || "/src/assets/image/logo.jpg"}
                    className="w-full h-48 object-cover"
                    alt={`${branch.name || branch.location} Image`}
                  />

                  <div className="p-6 flex-grow">
                    <h5 className="text-xl font-bold mb-2">
                      {branch.name || branch.location}
                    </h5>

                    <div className="flex items-center text-gray-600 mb-2">
                      <LocationMarkerIcon className="h-5 w-5 mr-2" />
                      <span>{branch.address}</span>
                    </div>

                    {/* <div className="flex items-center text-gray-600 mb-2">
                      <PhoneIcon className="h-5 w-5 mr-2" />
                      <span>{branch.contact || "N/A"}</span>
                    </div> */}
                    {/* <p className="text-gray-700">
                      {branch.description || "No description available."}
                    </p> */}
                  </div>

                  <div className="p-4 bg-gray-100 mt-auto">
                    <button
                      className="w-full md:w-auto cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                      onClick={() => navigate(`/branch_products/${branch.id}`)}
                    >
                      View Products
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default BranchLocation;