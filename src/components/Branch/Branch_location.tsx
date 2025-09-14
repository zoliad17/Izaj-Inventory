import { useNavigate } from "react-router-dom";
import { LocationMarkerIcon } from "@heroicons/react/outline";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useEffect, useState } from "react";
import { api } from "../../utils/apiClient";
import { ArrowLeft, Building2, ShoppingCart } from "lucide-react";
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
      console.error("User not authenticated or user data missing");
      navigate("/login");
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
              const { data: users, error: usersError } = await api.getUsers(
                b.id
              );

              if (
                usersError ||
                !users ||
                !Array.isArray(users) ||
                users.length === 0
              ) {
                console.log(`Branch ${b.location} has no users, skipping`);
                return null;
              }

              // Check if there's at least one Branch Manager
              const hasBranchManager = users.some((user: any) => {
                const roleName = user.role?.role_name || user.role_name;
                return (
                  roleName === "Branch Manager" || roleName === "BranchManager"
                );
              });

              if (!hasBranchManager) {
                console.log(
                  `Branch ${b.location} has no Branch Manager, skipping`
                );
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
              console.error(
                `Error checking users for branch ${b.location}:`,
                error
              );
              return null;
            }
          })
        );

        // Filter out null values (branches without users)
        const validBranches = branchesWithUsers.filter(
          (branch): branch is Branch => branch !== null
        );
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
      console.log("Filtering branches...", {
        totalBranches: branches.length,
        userBranchId: user?.branch_id,
        user: user,
      });

      let filtered = branches;

      // If user has a branch_id, filter out their own branch
      if (user?.branch_id) {
        const beforeFilter = filtered.length;
        filtered = branches.filter((branch) => {
          const shouldExclude = branch.id === user.branch_id;
          console.log(
            `Branch ${branch.location} (ID: ${branch.id}) - User branch: ${user.branch_id} - Exclude: ${shouldExclude}`
          );
          return !shouldExclude;
        });

        console.log(
          `Filtered out user's own branch. Before: ${beforeFilter}, After: ${filtered.length}`
        );
      } else {
        console.log("No user branch_id found, showing all branches");
      }

      setFilteredBranches(filtered);
    }
  }, [branches, user?.branch_id]);

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-3 mb-3 mt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-700 dark:text-gray-200 hover:text-blue-500 dark:hover:text-blue-400 transition-colors"
          >
            <ArrowLeft size={26} />
          </button>

          {/* Title with icon */}
          <div className="flex items-center gap-3">
            <Building2 size={32} className="text-blue-600 dark:text-blue-400" />
            <h5 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
              Active Branch
            </h5>
          </div>
        </div>

        {user?.branch_id && (
          <p className="text-base text-gray-600 dark:text-gray-400 mt-2 sm:mt-0">
            Showing other branches available for requests (excluding your
            branch)
          </p>
        )}
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="mt-5 flex justify-center items-center p-6">
          <div className="animate-spin rounded-full h-9 w-9 border-2 border-blue-500 border-t-transparent"></div>
          <span className="ml-3 text-base text-gray-600 dark:text-gray-400">
            Loading branches...
          </span>
        </div>
      ) : filteredBranches.length === 0 ? (
        <div className="mt-6 p-6 text-center">
          <div className="bg-yellow-100/70 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 rounded-xl p-5 shadow-sm">
            <p className="font-semibold text-yellow-800 dark:text-yellow-200 mb-2 text-lg">
              No branches available for requests
            </p>
            <p className="text-base text-yellow-700 dark:text-yellow-300">
              Other branches either have no registered users or no Branch
              Manager assigned.
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {filteredBranches.map((branch) => (
            <div
              key={branch.id}
              className="group flex flex-col bg-white/70 dark:bg-neutral-900/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/60 dark:border-neutral-700 overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
            >
              {/* Image */}
              <img
                src={
                  branch.map_snapshot_url ||
                  branch.image ||
                  "/src/assets/image/logo.jpg"
                }
                className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                alt={`${branch.name || branch.location} Map`}
                onError={(e) => {
                  if (
                    branch.map_snapshot_url &&
                    e.currentTarget.src !== "/src/assets/image/logo.jpg"
                  ) {
                    e.currentTarget.src = "/src/assets/image/logo.jpg";
                  }
                }}
              />

              {/* Content */}
              <div className="p-6 flex-grow">
                <h5 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {branch.name || branch.location}
                </h5>

                <div className="flex items-center text-gray-700 dark:text-gray-400 text-base">
                  <LocationMarkerIcon className="h-10 w-10 mr-2 text-gray-500 dark:text-gray-500" />
                  <span>{branch.address}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 bg-gray-50 dark:bg-neutral-800 border-t border-gray-200/60 dark:border-neutral-700">
                <button
                  onClick={() => navigate(`/unified_products/${branch.id}`)}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 
             text-white py-3 px-6 rounded-2xl shadow-lg 
             hover:scale-[1.02] hover:shadow-xl hover:from-blue-600 hover:via-blue-700 hover:to-blue-800 
             active:scale-95 transition-all duration-300 text-lg font-semibold"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Browse & Request
                </button>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-3 text-center">
                  ✓ Branch has registered users
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default BranchLocation;
