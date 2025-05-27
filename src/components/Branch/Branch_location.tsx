import { useNavigate } from "react-router-dom";
import { LocationMarkerIcon, PhoneIcon } from "@heroicons/react/outline";
import { useSidebar } from "../Sidebar/SidebarContext";
import SearchBar from "../Search_Bar/SearchBar";

// Define interface for Branch data
interface Branch {
  id: number;
  name: string;
  image: string;
  location: string;
  contact: string;
  description: string;
}

function BranchLocation() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  // Typed branch data array
  const branches: Branch[] = [
    {
      id: 1,
      name: "Lucena Branch",
      image: "/src/assets/image/lucena(7).jpg",
      location: "123 Main Street, Lucena City",
      contact: "(042) 123-4567",
      description:
        "This branch is located in the heart of Lucena City, offering a wide range of services to meet your needs. Visit us today!",
    },
    {
      id: 2,
      name: "Lucena Branch",
      image: "/src/assets/image/lucena(7).jpg",
      location: "123 Main Street, Lucena City",
      contact: "(042) 123-4567",
      description:
        "This branch is located in the heart of Lucena City, offering a wide range of services to meet your needs. Visit us today!",
    },
  ];

  const handleViewClick = () => {
    navigate("/branch_category");
  };
  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // custom search logic here
  };
  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
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
              <img
                src={branch.image}
                className="w-full h-48 object-cover"
                alt={`${branch.name} Image`}
              />

              <div className="p-6 flex-grow">
                <h5 className="text-xl font-bold mb-2">{branch.name}</h5>

                <div className="flex items-center text-gray-600 mb-2">
                  <LocationMarkerIcon className="h-5 w-5 mr-2" />
                  <span>{branch.location}</span>
                </div>

                <div className="flex items-center text-gray-600 mb-2">
                  <PhoneIcon className="h-5 w-5 mr-2" />
                  <span>{branch.contact}</span>
                </div>

                <p className="text-gray-700">{branch.description}</p>
              </div>

              <div className="p-4 bg-gray-100 mt-auto">
                <button
                  className="w-full md:w-auto cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                  onClick={handleViewClick}
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
