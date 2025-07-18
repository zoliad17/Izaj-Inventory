import { useNavigate } from "react-router-dom";
import { LocationMarkerIcon, PhoneIcon } from "@heroicons/react/outline";
import { useSidebar } from "../Sidebar/SidebarContext";
import SearchBar from "../Search_Bar/SearchBar";
import { useEffect, useState } from "react";
import { supabase } from "../../../backend/Server/Supabase/supabase";

// Define interface for Branch data
interface Branch {
  id: number;
  name: string | null;
  image: string | null;
  location: string;
  contact: string | null;
  description: string | null;
}

function BranchLocation() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  // State for branches
  const [branches, setBranches] = useState<Branch[]>([]);

  useEffect(() => {
    const fetchBranches = async () => {
      const { data, error } = await supabase.from("branch").select("id, location");
      if (error) {
        console.error("Failed to fetch branches:", error);
        setBranches([]);
      } else {
        // Map to Branch interface, set other fields to null
        setBranches(
          (data || []).map((b: any) => ({
            id: b.id,
            name: null,
            image: null,
            location: b.location,
            contact: null,
            description: null,
          }))
        );
      }
    };
    fetchBranches();
  }, []);

  const handleViewClick = () => {
    navigate("/branch_products");
  };
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // custom search logic here
  };
  return (
    <div
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4`}
    >
      {/* Search Bar */}
      <SearchBar
        onSearch={handleSearch}
        className="p-1.5"
        placeholder="Search Branches..."
      />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
        {branches.map((branch) => (
          <div key={branch.id} className="col flex flex-col">
            <div className="card h-full bg-white rounded-lg shadow-md overflow-hidden flex flex-col">
              {/* Placeholder image if null */}
              <img
                src={branch.image || "/src/assets/image/logo.jpg"}
                className="w-full h-48 object-cover"
                alt={`${branch.name || branch.location} Image`}
              />

              <div className="p-6 flex-grow">
                <h5 className="text-xl font-bold mb-2">{branch.name || branch.location}</h5>

                <div className="flex items-center text-gray-600 mb-2">
                  <LocationMarkerIcon className="h-5 w-5 mr-2" />
                  <span>{branch.location}</span>
                </div>

                <div className="flex items-center text-gray-600 mb-2">
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  <span>{branch.contact || "N/A"}</span>
                </div>

                <p className="text-gray-700">{branch.description || "No description available."}</p>
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
    </div>
  );
}

export default BranchLocation;
