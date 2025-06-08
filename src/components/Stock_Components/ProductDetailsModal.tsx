import { X } from "lucide-react";

interface ProductDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: {
    id: string;
    name: string;
    category: string;
    price: string;
    stock: number;
    status: "In Stock" | "Out of Stock" | "Low Stock";
    imageUrl: string;
    description?: string;
  };
}

export default function ProductDetailsModal({
  isOpen,
  onClose,
  product,
}: ProductDetailsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-3xl w-full">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold">{product.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <img
              src={product.imageUrl}
              alt={product.name}
              className="w-full h-auto rounded-lg object-cover"
            />
          </div>
          <div>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  ID:{" "}
                  <b className=" text-sm text-gray-500 font-mono">
                    {product.id}
                  </b>
                </h4>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Category:{" "}
                  <b className=" text-sm text-gray-500">{product.category}</b>
                </h4>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Price:{" "}
                  <b className="text-sm text-gray-500">Php {product.price}</b>
                </h4>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Stock:{" "}
                  <b className="text-sm text-gray-500">{product.stock}</b>
                </h4>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Status:{" "}
                  <span
                    className={`mt-1 px-2 py-1 rounded-full text-xs ${
                      product.status === "In Stock"
                        ? "bg-green-100 text-green-800"
                        : product.status === "Low Stock"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {product.status}
                  </span>
                </h4>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Description:{" "}
                  <b className="mt-1 text-sm text-gray-500">
                    {product.description || "No description available."}
                  </b>
                </h4>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
