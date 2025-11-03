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
      } dark:bg-gray-900/70 min-h-screen p-2 sm:p-4`}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div className="flex items-center gap-3 mb-3 mt-2">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 p-2 rounded-xl
         "
          >
            <ArrowLeft size={26} />
          </button>

          {/* Title with icon */}
          <div className="flex items-center gap-3">
            <Building2
              size={32}
              className="text-blue-600 dark:text-blue-400 drop-shadow-md"
            />
            <div>
              <h5 className="text-2xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight">
                Active Branch
              </h5>
              <p className="text-lg text-gray-600 dark:text-gray-400 mt-1">
                Select a branch to browse and request products from their
                inventory
              </p>
            </div>
          </div>
        </div>
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
          <div
            className="rounded-2xl p-5 shadow-[inset_6px_6px_12px_rgba(0,0,0,0.12),inset_-6px_-6px_12px_rgba(255,255,255,0.7)]
        dark:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.7),inset_-6px_-6px_12px_rgba(50,50,50,0.6)]
        bg-yellow-50/80 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700"
          >
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
              className="group flex flex-col rounded-2xl overflow-hidden
            shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.7)]
            dark:shadow-[8px_8px_16px_rgba(0,0,0,0.7),-8px_-8px_16px_rgba(50,50,50,0.6)]
            bg-gray-50 dark:bg-neutral-900 border border-gray-200/60 dark:border-neutral-700
            transition-all duration-500 hover:shadow-xl hover:-translate-y-1 hover:scale-[1.01]"
            >
              {/* Image */}
              <img
                src={
                  branch.map_snapshot_url ||
                  branch.image ||
                  "/dist/assets/image/logo.jpg"
                }
                className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-500"
                alt={`${branch.name || branch.location} Map`}
                onError={(e) => {
                  if (
                    branch.map_snapshot_url &&
                    e.currentTarget.src !== "/dist/assets/image/logo.jpg"
                  ) {
                    e.currentTarget.src = "/dist/assets/image/logo.jpg";
                  }
                }}
              />

              {/* Content */}
              <div className="p-6 flex-grow">
                <h5 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                  {branch.name || branch.location}
                </h5>

                <div className="flex items-center text-gray-700 dark:text-gray-400 text-base">
                  <LocationMarkerIcon className="h-6 w-6 mr-2 text-blue-500 dark:text-blue-400" />
                  <span>{branch.address}</span>
                </div>
              </div>

              {/* Footer */}
              <div className="p-5 border-t border-gray-200/60 dark:border-neutral-700 bg-gray-100/70 dark:bg-neutral-800/70">
                <button
                  onClick={() => navigate(`/unified_products/${branch.id}`)}
                  className="w-full flex items-center justify-center gap-2 
                py-3 px-6 rounded-2xl 
                shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)]
                dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(60,60,60,0.6)]
                hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]
                dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.85),inset_-6px_-6px_12px_rgba(70,70,70,0.7)]
                hover:scale-[1.05] active:scale-95
                transition-all duration-300 text-lg font-semibold
                bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900
                text-gray-800 dark:text-gray-100"
                >
                  <ShoppingCart className="w-5 h-5 text-blue-600 dark:text-blue-400 drop-shadow-md" />
                  <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
                    Browse & Request
                  </span>
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
