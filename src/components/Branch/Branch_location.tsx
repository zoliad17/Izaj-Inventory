import { useNavigate } from "react-router-dom";
import { LocationMarkerIcon } from "@heroicons/react/outline";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useEffect, useState } from "react";
import { api } from "../../utils/apiClient";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";

// Define interface for Branch data
interface Branch {
  id: number;
  name: string;
  image: string | null;
  location: string;
  address: string | null;
  contact: string | null;
  description: string | null;
  map_snapshot_url: string | null;
}


function BranchLocation() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const { user, isAuthenticated } = useAuth();

  // State for branches
  const [branches, setBranches] = useState<Branch[]>([]);
  const [filteredBranches, setFilteredBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Check authentication
  useEffect(() => {
    if (!isAuthenticated || !user) {
      console.error('User not authenticated or user data missing');
      navigate('/login');
    }
  }, [isAuthenticated, user, navigate]);

  useEffect(() => {
    const fetchBranchesWithUsers = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await api.getBranches();

        if (error) {
          console.error("Failed to fetch branches:", error);
          setBranches([]);
          setFilteredBranches([]);
          return;
        }

        if (!Array.isArray(data)) {
          setBranches([]);
          setFilteredBranches([]);
          return;
        }

        // Check each branch for users and filter out branches without users
        const branchesWithUsers = await Promise.all(
          data.map(async (b: any) => {
            try {
              // Check if this branch has users
              const { data: users, error: usersError } = await api.getUsers(b.id);

              if (usersError || !users || !Array.isArray(users) || users.length === 0) {
                console.log(`Branch ${b.location} has no users, skipping`);
                return null;
              }

              // Check if there's at least one Branch Manager
              const hasBranchManager = users.some((user: any) => {
                const roleName = user.role?.role_name || user.role_name;
                return roleName === 'Branch Manager' || roleName === 'BranchManager';
              });

              if (!hasBranchManager) {
                console.log(`Branch ${b.location} has no Branch Manager, skipping`);
                return null;
              }

              // Return branch data if it has valid users
              return {
                id: b.id,
                name: b.name || null,
                image: b.image || null,
                location: b.location,
                contact: b.contact || null,
                description: b.description || null,
                address: b.address || null,
                map_snapshot_url: b.map_snapshot_url || null,
              };
            } catch (error) {
              console.error(`Error checking users for branch ${b.location}:`, error);
              return null;
            }
          })
        );

        // Filter out null values (branches without users)
        const validBranches = branchesWithUsers.filter((branch): branch is Branch => branch !== null);
        setBranches(validBranches);

      } catch (error) {
        console.error("Error fetching branches with users:", error);
        setBranches([]);
        setFilteredBranches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranchesWithUsers();
  }, []);

  // Filter branches based on user's branch_id
  useEffect(() => {
    if (branches.length > 0) {
      console.log('Filtering branches...', {
        totalBranches: branches.length,
        userBranchId: user?.branch_id,
        user: user
      });

      let filtered = branches;

      // If user has a branch_id, filter out their own branch
      if (user?.branch_id) {
        const beforeFilter = filtered.length;
        filtered = branches.filter((branch) => {
          const shouldExclude = branch.id === user.branch_id;
          console.log(`Branch ${branch.location} (ID: ${branch.id}) - User branch: ${user.branch_id} - Exclude: ${shouldExclude}`);
          return !shouldExclude;
        });

        console.log(`Filtered out user's own branch. Before: ${beforeFilter}, After: ${filtered.length}`);
      } else {
        console.log('No user branch_id found, showing all branches');
      }

      setFilteredBranches(filtered);
    }
  }, [branches, user?.branch_id]);

  return (
    <div
      className={`transition-all duration-300 ${isCollapsed ? "ml-5" : "ml-1"
        } p-2 sm:p-4 dark:bg-neutral-950`}
    >
      {/* <div className="p-3 bg-white dark:bg-neutral-800 rounded-lg shadow"> */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-4 mb-2.5 mt-2.5">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center cursor-pointer gap-2 text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
          >
            <ArrowLeft size={20} />
          </button>
          <h5 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Active Branch
          </h5>
        </div>
        {user?.branch_id && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 sm:mt-0">
            Showing other branches available for requests (excluding your branch)
          </p>
        )}
      </div>

      {/* Show loading state */}
      {isLoading ? (
        <div className="mt-5 p-6 text-center">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2 text-gray-600 dark:text-gray-400">Loading branches...</span>
          </div>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="mt-5 p-6 text-center text-gray-500 dark:text-gray-400">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="font-medium text-yellow-800 dark:text-yellow-200 mb-2">
              No branches available for requests
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300">
              Other branches either have no registered users or no Branch Manager assigned.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-5">
          {filteredBranches.map((branch) => (
            <div key={branch.id} className="col flex flex-col">
              <div className="card h-full bg-white dark:bg-neutral-800 rounded-lg shadow-md overflow-hidden outline-1 flex flex-col border border-gray-200 dark:border-neutral-700">
                {/* Display map snapshot or default image */}
                <img
                  src={branch.map_snapshot_url || branch.image || "/src/assets/image/logo.jpg"}
                  className="w-full h-48 object-cover"
                  alt={`${branch.name || branch.location} Map`}
                  onError={(e) => {
                    // Fallback to default image if map_snapshot_url fails to load
                    if (branch.map_snapshot_url && e.currentTarget.src !== "/src/assets/image/logo.jpg") {
                      e.currentTarget.src = "/src/assets/image/logo.jpg";
                    }
                  }}
                />

                <div className="p-6 flex-grow">
                  <h5 className="text-xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                    {branch.name || branch.location}
                  </h5>

                  <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                    <LocationMarkerIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-500" />
                    <span>{branch.address}</span>
                  </div>

                  {/* <div className="flex items-center text-gray-600 dark:text-gray-400 mb-2">
                  <PhoneIcon className="h-5 w-5 mr-2 text-gray-500 dark:text-gray-500" />
                  <span>{branch.contact || "N/A"}</span>
                </div> */}
                  {/* <p className="text-gray-700 dark:text-gray-300">
                  {branch.description || "No description available."}
                </p> */}
                </div>

                <div className="p-4 bg-gray-100 dark:bg-neutral-700 mt-auto">
                  <button
                    className="w-full cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                    onClick={() => navigate(`/unified_products/${branch.id}`)}
                  >
                    Browse & Request Products
                  </button>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-2 text-center">
                    ✓ Branch has registered users
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BranchLocation;
