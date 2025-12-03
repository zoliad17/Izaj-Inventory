import { useNavigate } from "react-router-dom";
import {
  LocationMarkerIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  XIcon,
  MapIcon,
  ExclamationCircleIcon,
  LightBulbIcon,
} from "@heroicons/react/outline";
import { useSidebar } from "../Sidebar/SidebarContext";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2 } from "lucide-react";
import toast from "react-hot-toast";
import { Branch, BranchFormData } from "../../types";
import SimpleGoogleMapPicker from "../ui/SimpleGoogleMapPicker";
import { generateStaticMapUrl, MapCoordinates } from "../../utils/mapUtils";
import { API_BASE_URL } from "../../config/config";

// Google Maps type declarations
declare global {
  interface Window {
    google: any;
  }
}

function AdminBranchManagement() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const [branches, setBranches] = useState<Branch[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<BranchFormData>({
    location: "",
    address: "",
    latitude: null,
    longitude: null,
    map_snapshot_url: null,
  });
  const [selectedCoordinates, setSelectedCoordinates] =
    useState<MapCoordinates | null>(null);
  const [showMap, setShowMap] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  // Add state for delete confirmation modal
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [branchToDelete, setBranchToDelete] = useState<number | null>(null);

  // Reuse the same fetch logic as Branch_location.tsx
  useEffect(() => {
    const fetchBranches = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/branches`);
        if (!response.ok) throw new Error("Failed to fetch branches");
        const data = await response.json();
        setBranches(data || []);
      } catch (error) {
        console.error("Failed to fetch branches:", error);
        toast.error("Failed to load branches");
        setBranches([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchBranches();
  }, []);

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      location: branch.location,
      address: branch.address || "",
      latitude: branch.latitude || null,
      longitude: branch.longitude || null,
      map_snapshot_url: branch.map_snapshot_url || null,
    });
    setSelectedCoordinates(
      branch.latitude && branch.longitude
        ? { lat: branch.latitude, lng: branch.longitude }
        : null
    );
    setIsModalOpen(true);
  };

  const handleDeleteBranch = async (branchId: number) => {
    // Instead of using window.confirm, set state to show custom modal
    setBranchToDelete(branchId);
    setIsDeleteModalOpen(true);
  };

  // New function to actually perform the deletion
  const confirmDeleteBranch = async () => {
    if (!branchToDelete) return;

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/branches/${branchToDelete}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) throw new Error("Failed to delete branch");

      // Remove from local state
      setBranches((prev) =>
        prev.filter((branch) => branch.id !== branchToDelete)
      );
      toast.success("Branch deleted successfully");
    } catch (error) {
      console.error("Error deleting branch:", error);
      toast.error("Failed to delete branch");
    } finally {
      // Close the modal and reset state
      setIsDeleteModalOpen(false);
      setBranchToDelete(null);
    }
  };

  // Function to cancel deletion
  const cancelDeleteBranch = () => {
    setIsDeleteModalOpen(false);
    setBranchToDelete(null);
  };

  const handleAddBranch = () => {
    setEditingBranch(null);
    setFormData({
      location: "",
      address: "",
      latitude: null,
      longitude: null,
      map_snapshot_url: null,
    });
    setSelectedCoordinates(null);
    setShowMap(false);
    setSuggestions([]);
    setShowSuggestions(false);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingBranch(null);
    setFormData({
      location: "",
      address: "",
      latitude: null,
      longitude: null,
      map_snapshot_url: null,
    });
    setSelectedCoordinates(null);
    setShowMap(false);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLocationSelect = (
    coordinates: MapCoordinates,
    address: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      address,
      latitude: coordinates.lat,
      longitude: coordinates.lng,
    }));
    setSelectedCoordinates(coordinates);
    setMapError(null);
    setShowSuggestions(false); // Hide suggestions when location is selected
  };

  // Handle address input changes with geocoding suggestions
  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFormData({ ...formData, address: value });

    if (value.length > 2) {
      setIsLoadingSuggestions(true);
      // Use geocoding for suggestions
      if (window.google && window.google.maps) {
        const geocoder = new window.google.maps.Geocoder();
        geocoder.geocode(
          { address: value },
          (results: any[], status: string) => {
            setIsLoadingSuggestions(false);
            if (status === "OK" && results) {
              const formattedSuggestions = results.map(
                (result: any, index: number) => ({
                  place_id: `geocoding_${index}_${Date.now()}`,
                  description: result.formatted_address,
                  structured_formatting: {
                    main_text:
                      result.address_components[0]?.long_name ||
                      result.formatted_address,
                    secondary_text: result.formatted_address,
                  },
                  geometry: {
                    location: {
                      lat: result.geometry.location.lat(),
                      lng: result.geometry.location.lng(),
                    },
                  },
                })
              );
              setSuggestions(formattedSuggestions);
              setShowSuggestions(true);
            } else {
              setSuggestions([]);
              setShowSuggestions(false);
            }
          }
        );
      }
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: any) => {
    if (suggestion.geometry?.location) {
      const coordinates = {
        lat: suggestion.geometry.location.lat,
        lng: suggestion.geometry.location.lng,
      };
      setSelectedCoordinates(coordinates);
      setFormData({
        ...formData,
        address: suggestion.description,
        latitude: coordinates.lat,
        longitude: coordinates.lng,
      });
      setShowSuggestions(false);
    }
  };

  // Handle clicking outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const isInputClick =
        target && (target as Element).closest('input[name="address"]');
      const isSuggestionClick =
        target && (target as Element).closest('[data-suggestion="true"]');

      if (!isInputClick && !isSuggestionClick) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const toggleMap = () => {
    setShowMap(!showMap);
    if (!showMap) {
      setIsMapLoading(true);
      setMapError(null);
      // Set loading to false after a short delay to allow the map to load
      setTimeout(() => {
        setIsMapLoading(false);
      }, 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Generate static map snapshot if coordinates are available
      let mapSnapshotUrl = formData.map_snapshot_url;
      if (formData.latitude && formData.longitude && formData.address) {
        mapSnapshotUrl = generateStaticMapUrl(
          { lat: formData.latitude, lng: formData.longitude },
          formData.address
        );
      }

      const submitData = {
        ...formData,
        map_snapshot_url: mapSnapshotUrl,
      };

      const url = editingBranch
        ? `${API_BASE_URL}/api/branches/${editingBranch.id}`
        : `${API_BASE_URL}/api/branches`;

      const method = editingBranch ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error ||
            `Failed to ${editingBranch ? "update" : "add"} branch`
        );
      }

      const result = await response.json();

      if (editingBranch) {
        // Update existing branch in state
        setBranches((prev) =>
          prev.map((branch) =>
            branch.id === editingBranch.id
              ? {
                  ...branch,
                  location: formData.location,
                  address: formData.address,
                  latitude: formData.latitude,
                  longitude: formData.longitude,
                  map_snapshot_url: mapSnapshotUrl,
                }
              : branch
          )
        );
        toast.success("Branch updated successfully!");
      } else {
        // Add new branch to state (using PUT, so result should contain the new branch data)
        setBranches((prev) => [...prev, result]);
        toast.success("Branch added successfully!");
      }

      handleCloseModal();
    } catch (error) {
      console.error(
        `Error ${editingBranch ? "updating" : "adding"} branch:`,
        error
      );
      toast.error(
        error instanceof Error
          ? error.message
          : `Failed to ${editingBranch ? "update" : "add"} branch`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 dark:bg-gray-900/70 min-h-screen `}
    >
      <div className="px-4 py-6 rounded-lg mb-3.5 shadow-md bg-white dark:bg-gray-900 transition-colors">
        <div className="">
          {/* Header with Back Button and Title in One Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-1">
              {/* Back Button with Neumorphic Design */}
              <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 sm:py-2
                 text-gray-700 dark:text-gray-300 rounded-xl 
                  duration-300 font-medium 
                  text-sm sm:text-base"
              >
                <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>

              <div>
                <h5 className="text-2xl md:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                  Branch Management
                </h5>
                <p className="text-gray-600 dark:text-gray-400 mt-1">
                  Manage all branch locations and their details
                </p>
              </div>
            </div>

            <button
              onClick={handleAddBranch}
              className="flex items-center text-blue-600 neumorphic-button-transparent gap-2 px-4 py-3 rounded-xl shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.2)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(60,60,60,0.1)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.1)] dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.3),inset_-4px_-4px_8px_rgba(60,60,60,0.1)] transition-all duration-300 font-medium border border-blue-400/30 whitespace-nowrap"
            >
              <PlusIcon className="h-5 w-5" />
              <span className="hidden sm:inline">Add New Branch</span>
              <span className="sm:hidden">Add Branch</span>
            </button>
          </div>

          {/* Loading State */}
          {isLoading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : branches.length === 0 ? (
            <div className="mt-5 p-6 text-center text-gray-500 dark:text-gray-400">
              <p>No branches found.</p>
            </div>
          ) : (
            /* Grid Layout - Responsive grid for branch cards */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-5 mt-5">
              {branches.map((branch) => {
                const mapUrl = branch.map_snapshot_url
                  ? branch.map_snapshot_url
                  : branch.latitude && branch.longitude
                  ? generateStaticMapUrl(
                      { lat: branch.latitude, lng: branch.longitude },
                      branch.location
                    )
                  : null;

                return (
                  <div
                    key={branch.id}
                    className="bg-white/20 dark:bg-gray-800/30 backdrop-blur-sm rounded-2xl shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.2)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.3),-6px_-6px_12px_rgba(60,60,60,0.1)] border border-white/20 p-4 transition-all duration-300 hover:shadow-[8px_8px_16px_rgba(0,0,0,0.15),-8px_-8px_16px_rgba(255,255,255,0.3)] dark:hover:shadow-[8px_8px_16px_rgba(0,0,0,0.4),-8px_-8px_16px_rgba(60,60,60,0.2)] flex flex-col h-full"
                  >
                    {/* Branch Image/Map - Show map snapshot if available */}
                    <div className="w-full h-40 sm:h-48 relative">
                      {mapUrl ? (
                        <img
                          src={mapUrl}
                          alt={`Map of ${branch.location}`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback to gradient if image fails to load
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            const parent = target.parentElement;
                            if (parent) {
                              parent.innerHTML = `
                              <div class="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                                <svg class="h-16 w-16 text-white" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd" />
                                </svg>
                              </div>
                            `;
                            }
                          }}
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                          <LocationMarkerIcon className="h-16 w-16 mb text-white" />
                        </div>
                      )}
                      {branch.latitude && branch.longitude && (
                        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-base px-2 py-1 rounded">
                          {branch.latitude.toFixed(4)},{" "}
                          {branch.longitude.toFixed(4)}
                        </div>
                      )}
                    </div>

                    {/* Content - Reuse same structure */}
                    <div className="p-4 flex-grow">
                      <h5 className="text-xl sm:text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">
                        {branch.location}
                      </h5>

                      <div className="flex items-start text-base text-gray-600 dark:text-gray-400 mb-2 group relative">
                        <LocationMarkerIcon className="h-5 w-5 mr-2 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />

                        {/* Truncated text with tooltip */}
                        <span className="truncate max-w-[160px] sm:max-w-[200px] cursor-help">
                          {branch.address || "No address provided"}
                        </span>

                        {/* Tooltip on full addresss */}
                        {branch.address && (
                          <div
                            className="absolute left-7 bottom-full mb-1 hidden group-hover:block 
                    whitespace-normal px-3 py-1 text-sm rounded-lg shadow-lg
                    bg-gray-800 text-white dark:bg-gray-900 dark:text-gray-100 
                    z-10 max-w-xs"
                          >
                            {branch.address}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Actions - Admin-specific */}

                    <div className="flex space-x-2">
                      {/* Edit Button (Green Touch, Transparent) */}
                      <button
                        onClick={() => handleEditBranch(branch)}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl
      shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)]
      dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(60,60,60,0.6)]
      hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]
      dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.85),inset_-6px_-6px_12px_rgba(70,70,70,0.7)]
      hover:scale-[1.02] active:scale-[0.98]
      transition-all duration-300 text-sm sm:text-lg font-semibold
      bg-transparent
      text-green-600 dark:text-green-300 border border-green-500/30"
                      >
                        <PencilIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">Edit</span>
                      </button>

                      {/* Delete Button (Red Touch, Transparent) */}
                      <button
                        onClick={() => handleDeleteBranch(branch.id)}
                        className="flex-1 flex items-center justify-center gap-1 sm:gap-2 px-3 py-2 sm:px-4 sm:py-3 rounded-xl
      shadow-[6px_6px_12px_rgba(0,0,0,0.12),-6px_-6px_12px_rgba(255,255,255,0.7)]
      dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(60,60,60,0.6)]
      hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.15),inset_-6px_-6px_12px_rgba(255,255,255,0.9)]
      dark:hover:shadow-[inset_6px_6px_12px_rgba(0,0,0,0.85),inset_-6px_-6px_12px_rgba(70,70,70,0.7)]
      hover:scale-[1.02] active:scale-[0.98]
      transition-all duration-300 text-sm sm:text-lg font-semibold
      bg-transparent
      text-red-600 dark:text-red-300 border border-red-500/30"
                      >
                        <TrashIcon className="h-4 w-4 sm:h-5 sm:w-5" />
                        <span className="hidden xs:inline">Delete</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Add/Edit Branch Modal */}
          {isModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4 overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[10px_10px_20px_rgba(0,0,0,0.1),-10px_-10px_20px_rgba(255,255,255,0.2)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-10px_-10px_20px_rgba(60,60,60,0.1)] w-full max-w-4xl max-h-[90vh] overflow-y-auto border border-gray-200 dark:border-gray-700 my-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                      <MapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {editingBranch
                          ? "Edit Branch Location"
                          : "Add New Branch"}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {editingBranch
                          ? "Update the branch location and address information"
                          : "Set up a new branch with precise location data"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleCloseModal}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-6">
                  {/* Progress Indicator */}
                  <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          formData.location
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                        }`}
                      >
                        1
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        Branch Name
                      </span>
                    </div>
                    <div className="flex-1 min-w-[50px] h-px bg-gray-200 dark:bg-gray-600 hidden sm:block"></div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          formData.address
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                        }`}
                      >
                        2
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        Location
                      </span>
                    </div>
                    <div className="flex-1 min-w-[50px] h-px bg-gray-200 dark:bg-gray-600 hidden sm:block"></div>
                    <div className="flex items-center space-x-2">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                          selectedCoordinates
                            ? "bg-green-500 text-white"
                            : "bg-gray-200 dark:bg-gray-600 text-gray-500"
                        }`}
                      >
                        3
                      </div>
                      <span className="text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                        Map
                      </span>
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="location"
                      className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
                    >
                      Branch Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      id="location"
                      name="location"
                      value={formData.location}
                      onChange={handleInputChange}
                      required
                      className="w-full px-4 py-3 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                      placeholder="e.g., Northwest Regional Office"
                    />
                  </div>

                  {/* Location Section */}
                  <div className="space-y-6">
                    {/* Section Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <MapIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                            Branch Location
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            Select the exact location for this branch
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={toggleMap}
                        className={`px-3 py-2 sm:px-4 sm:py-2 rounded-lg transition duration-300 flex items-center gap-1 sm:gap-2 text-sm font-medium ${
                          showMap
                            ? "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                            : "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300"
                        }`}
                      >
                        <MapIcon className="h-4 w-4" />
                        <span className="whitespace-nowrap">
                          {showMap ? "Hide Map" : "Show Map"}
                        </span>
                      </button>
                    </div>

                    {/* Address Input with Smart Status */}
                    <div className="space-y-3">
                      <label
                        htmlFor="address"
                        className="block text-sm font-medium text-gray-700 dark:text-gray-300"
                      >
                        Branch Address <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          id="address"
                          name="address"
                          value={formData.address}
                          onChange={handleAddressChange}
                          onFocus={() =>
                            setShowSuggestions(suggestions.length > 0)
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault(); // Prevent form submission
                            }
                          }}
                          required
                          className="w-full px-4 py-3 pr-12 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 border border-gray-300 dark:border-gray-600 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
                          placeholder="Type address or search for a location..."
                        />
                        {/* Smart Status Indicator */}
                        <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                          {isLoadingSuggestions ? (
                            <div
                              className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"
                              title="Loading suggestions..."
                            ></div>
                          ) : selectedCoordinates ? (
                            <div
                              className="w-4 h-4 bg-green-500 rounded-full"
                              title="Location selected"
                            ></div>
                          ) : formData.address ? (
                            <div
                              className="w-4 h-4 bg-yellow-400 rounded-full animate-pulse"
                              title="Address entered, select location on map"
                            ></div>
                          ) : (
                            <div title="No location selected">
                              <MapIcon className="h-5 w-5 text-gray-400" />
                            </div>
                          )}
                        </div>

                        {/* Autocomplete Suggestions Dropdown */}
                        {showSuggestions && suggestions.length > 0 && (
                          <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                            {suggestions.map((suggestion, index) => (
                              <div
                                key={suggestion.place_id || index}
                                className="px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer border-b border-gray-200 dark:border-gray-600 last:border-b-0"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleSuggestionClick(suggestion);
                                }}
                                onMouseDown={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                }}
                                data-suggestion="true"
                              >
                                <div className="flex items-start space-x-3">
                                  <div className="text-gray-400 mt-1">
                                    <svg
                                      className="w-4 h-4"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                      {suggestion.structured_formatting
                                        ?.main_text || suggestion.description}
                                    </p>
                                    {suggestion.structured_formatting
                                      ?.secondary_text && (
                                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {
                                          suggestion.structured_formatting
                                            .secondary_text
                                        }
                                      </p>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Location Status */}
                      {selectedCoordinates && (
                        <div className="flex items-center justify-between text-sm p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <span className="flex items-center text-green-600 dark:text-green-400">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                            Location selected
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                            {selectedCoordinates.lat.toFixed(6)},{" "}
                            {selectedCoordinates.lng.toFixed(6)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Compact Help Text */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4 border border-blue-200 dark:border-blue-800">
                      <div className="flex items-start space-x-2">
                        <LightBulbIcon className="h-5 w-5 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                        <div className="text-sm text-blue-700 dark:text-blue-300">
                          <span className="font-medium">Quick tip:</span> Type
                          an address for suggestions, or click on the map to
                          select a location. Drag the marker to fine-tune the
                          position.
                        </div>
                      </div>
                    </div>

                    {/* Interactive Map */}
                    {showMap && (
                      <div className="space-y-3">
                        {/* Map Header */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600">
                          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center">
                            <MapIcon className="h-4 w-4 mr-2" />
                            Interactive Map
                          </h4>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Click to select location
                          </span>
                        </div>

                        {/* Map Container */}
                        <div className="relative">
                          {/* Map Loading State */}
                          {isMapLoading && (
                            <div className="flex items-center justify-center h-80 bg-gray-50 dark:bg-gray-700 rounded-xl border border-gray-200 dark:border-gray-600">
                              <div className="text-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  Loading map...
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Map Error State */}
                          {mapError && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl border border-red-200 dark:border-red-800">
                              <div className="flex items-center space-x-2">
                                <ExclamationCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm text-red-700 dark:text-red-300 font-medium">
                                    Map Error
                                  </p>
                                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">
                                    {mapError}
                                  </p>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => {
                                  setMapError(null);
                                  setIsMapLoading(true);
                                }}
                                className="mt-2 px-3 py-1 text-xs text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200 underline"
                              >
                                Try again
                              </button>
                            </div>
                          )}

                          {/* Map Component */}
                          {!isMapLoading && !mapError && (
                            <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-600 shadow-md">
                              <SimpleGoogleMapPicker
                                onLocationSelect={handleLocationSelect}
                                initialLocation={
                                  selectedCoordinates || undefined
                                }
                                initialAddress={formData.address || ""}
                                externalAddress={formData.address || ""}
                                height="300px"
                                className="w-full"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                    <button
                      type="button"
                      onClick={handleCloseModal}
                      className="px-4 py-2 sm:px-6 sm:py-2 rounded-xl font-bold bg-transparent text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 sm:px-6 sm:py-2 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isSubmitting
                        ? editingBranch
                          ? "Updating..."
                          : "Adding..."
                        : editingBranch
                        ? "Update Branch"
                        : "Add Branch"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Delete Confirmation Modal */}
          {isDeleteModalOpen && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/50 dark:bg-black/70 z-50 p-4 overflow-y-auto">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-[10px_10px_20px_rgba(0,0,0,0.1),-10px_-10px_20px_rgba(255,255,255,0.2)] dark:shadow-[10px_10px_20px_rgba(0,0,0,0.3),-10px_-10px_20px_rgba(60,60,60,0.1)] w-full max-w-md border border-white/20 my-4">
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                      <ExclamationCircleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                        Confirm Branch Deletion
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={cancelDeleteBranch}
                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <XIcon className="h-6 w-6" />
                  </button>
                </div>

                <div className="p-6">
                  <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 border border-red-200 dark:border-red-800 mb-6">
                    <div className="flex items-start space-x-3">
                      <ExclamationCircleIcon className="h-5 w-5 text-red-500 dark:text-red-400 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-bold text-red-800 dark:text-red-200 text-lg">
                          Important Notice
                        </h4>
                        <p className="text-red-700 dark:text-red-300 mt-2 font-medium">
                          This action cannot be undone. All data related to this
                          branch will be permanently removed from the system.
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="text-gray-800 dark:text-gray-200 mb-4 font-medium text-base">
                    You are about to delete a branch location from the system.
                  </p>

                  <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 mb-6 border border-gray-200 dark:border-gray-600">
                    <div className="flex items-center text-base text-gray-700 dark:text-gray-300 mb-2">
                      <span className="font-bold w-24">Action:</span>
                      <span className="font-semibold">
                        Delete Branch Location
                      </span>
                    </div>
                    <div className="flex items-center text-base text-red-600 dark:text-red-400">
                      <span className="font-bold w-24">Warning:</span>
                      <span className="font-semibold">
                        Irreversible operation
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3">
                    <button
                      onClick={cancelDeleteBranch}
                      className="px-4 py-2 sm:px-6 sm:py-2 rounded-xl font-bold bg-transparent text-gray-700 dark:text-gray-300 shadow-[inset_2px_2px_5px_rgba(0,0,0,0.05),inset_-2px_-2px_5px_rgba(255,255,255,0.6)] dark:shadow-[inset_2px_2px_5px_rgba(0,0,0,0.7),inset_-2px_-2px_5px_rgba(60,60,60,0.3)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.7),inset_-4px_-4px_8px_rgba(40,40,40,0.5)] transition-all duration-300 border border-gray-300/30"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmDeleteBranch}
                      className="px-4 py-2 sm:px-6 sm:py-2 rounded-xl font-bold text-white bg-red-600 shadow-[6px_6px_12px_rgba(0,0,0,0.1),-6px_-6px_12px_rgba(255,255,255,0.6)] dark:shadow-[6px_6px_12px_rgba(0,0,0,0.7),-6px_-6px_12px_rgba(40,40,40,0.5)] hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.1),inset_-4px_-4px_8px_rgba(255,255,255,0.5)] dark:hover:shadow-[inset_4px_4px_8px_rgba(0,0,0,0.7),inset_-4px_-4px_8px_rgba(40,40,40,0.5)] transition-all duration-300 border border-red-500/30"
                    >
                      Confirm Deletion
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminBranchManagement;
