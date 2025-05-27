import { LocationMarkerIcon } from "@heroicons/react/outline";
import { useNavigate } from "react-router-dom";
import { useSidebar } from "../Sidebar/SidebarContext";
import SearchBar from "../Search_Bar/SearchBar";

// Define interface for category data
interface Category {
  id: string;
  name: string;
  type: string;
  image: string;
  features: string[];
  route: string;
}

function Branch_category() {
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();

  // Sample category data with proper typing
  const categoryData: Category = {
    id: "led-1",
    name: "LED Lights",
    type: "Category",
    image: "/src/assets/image/light1.jpg",
    features: [
      "Energy-efficient and long-lasting",
      "Available in various colors and styles",
    ],
    route: "/branch_products",
  };

  const handleSearch = (query: string) => {
    console.log("Searching for:", query);
    // Your custom search logic here
  };

  return (
    <div
      className={`transition-all duration-300 ${
        isCollapsed ? "ml-5" : "ml-1"
      } p-2 sm:p-4 `}
    >
      <SearchBar
        onSearch={handleSearch}
        className="p-1.5"
        placeholder="Search Category..."
      />

      <div className="flex items-center mt-3">
        <LocationMarkerIcon className="h-5 w-5 mr-2" />
        <h1 className="text-2xl font-bold">Lucena</h1>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-5">
        {/* Product Category Card */}
        <div className="card bg-white rounded-lg shadow-md overflow-hidden max-w-2xl">
          <div className="flex flex-col md:flex-row">
            {/* Product Image */}
            <div className="md:w-1/3">
              <img
                src={categoryData.image}
                className="w-full h-48 md:h-full object-cover p-3 rounded-3xl"
                alt={categoryData.name}
              />
            </div>

            {/* Product Details */}
            <div className="md:w-2/3 p-6">
              <h5 className="text-xl font-bold mb-2">{categoryData.name}</h5>
              <h6 className="text-sm font-bold mb-2">{categoryData.type}</h6>

              {categoryData.features.map((feature, index) => (
                <div
                  key={index}
                  className="flex items-center text-gray-600 mb-2"
                >
                  <span>{feature}</span>
                </div>
              ))}

              <button
                className="w-full md:w-auto cursor-pointer bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-blue-600 transition duration-300"
                onClick={() => {
                  console.log(`View ${categoryData.name}`);
                  navigate(categoryData.route);
                }}
              >
                View Products
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Branch_category;
