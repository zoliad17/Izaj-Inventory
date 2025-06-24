import {
  Calendar,
  MapPin,
  ClipboardList,
  AlertCircle,
  ChevronDown,
  Plus,
  Trash2,
  Package,
  Box,
  CheckCircle2,
  XCircle,
  XCircleIcon,
} from "lucide-react";
import { useState, useEffect } from "react";
import { Toaster } from "react-hot-toast";

// Product data constant
const PRODUCTS = [
  { sku: "LED-100W", name: "100W LED Bulb", category: "LED Bulbs" },
  { sku: "LED-60W", name: "60W LED Bulb", category: "LED Bulbs" },
  {
    sku: "FL-T8-32W",
    name: "32W T8 Fluorescent Tube",
    category: "Fluorescent Tubes",
  },
  {
    sku: "FL-T5-24W",
    name: "24W T5 Fluorescent Tube",
    category: "Fluorescent Tubes",
  },
  { sku: "HAL-PAR38", name: "PAR38 Halogen Lamp", category: "Halogen Lights" },
  { sku: "SMART-RGB", name: "Smart RGB Bulb", category: "Smart Lighting" },
  {
    sku: "OUT-FLOD",
    name: "Flood Light Outdoor",
    category: "Outdoor Lighting",
  },
  {
    sku: "IND-HIGH",
    name: "High Bay Industrial Light",
    category: "Industrial Lighting",
  },
];

// Branch data constant
const BRANCHES = [
  { id: "c01", name: "Lucena" },
  { id: "c02", name: "Cavite" },
];

interface RequestItem {
  sku: string;
  productName: string;
  description: string;
  quantity: number;
  reason: string;
  urgency: "low" | "medium" | "high";
}

export default function Send_Request() {
  const [date, setDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [branchLocation, setBranchLocation] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [requestItems, setRequestItems] = useState<RequestItem[]>([
    {
      sku: "",
      productName: "",
      description: "",
      quantity: 1,
      reason: "",
      urgency: "medium",
    },
  ]);

  const addItem = () => {
    setRequestItems([
      ...requestItems,
      {
        sku: "",
        productName: "",
        description: "",
        quantity: 1,
        reason: "",
        urgency: "medium",
      },
    ]);
  };

  const removeItem = (index: number) => {
    if (requestItems.length > 1) {
      const newItems = [...requestItems];
      newItems.splice(index, 1);
      setRequestItems(newItems);
    }
  };

  const handleItemChange = (
    index: number,
    field: keyof RequestItem,
    value: string | number
  ) => {
    const newItems = [...requestItems];
    newItems[index][field] = value as never;

    if (field === "sku" && typeof value === "string") {
      const selectedProduct = PRODUCTS.find((p) => p.sku === value);
      if (selectedProduct) {
        newItems[index].productName = selectedProduct.name;
      }
    }

    setRequestItems(newItems);
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    if (submitStatus) {
      const timer = setTimeout(() => {
        setSubmitStatus(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [submitStatus]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      setSubmitStatus({
        success: true,
        message: "Request submitted successfully!",
      });

      setTimeout(() => {
        setRequestItems([
          {
            sku: "",
            productName: "",
            description: "",
            quantity: 1,
            reason: "",
            urgency: "medium",
          },
        ]);
        setNotes("");
      }, 2000);
    } catch (error) {
      setSubmitStatus({
        success: false,
        message:
          error instanceof Error
            ? error.message
            : "Submission failed. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white rounded-lg shadow-md">
      {/* Toaster for success and error */}
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 2000,
          style: {
            background: "#363636",
            color: "#fff",
          },
        }}
      />
      <div className="relative mb-8">
        <h1 className="text-2xl ml-2.5 font-bold text-gray-800">
          Request Form
        </h1>
        <button
          className="absolute top-0 right-0 cursor-pointer p-1 text-gray-500 hover:text-gray-700 focus:outline-none"
          onClick={() => window.history.back()}
          aria-label="Close"
        >
          <XCircleIcon className="h-8 w-10" />
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 ml-2.5 mb-8">
          {/* Date Field */}
          <div className="space-y-2 ">
            <label
              htmlFor="date"
              className="block text-sm font-medium text-gray-700"
            >
              Date
            </label>
            <div className="relative">
              <input
                type="date"
                id="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <Calendar className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>

          {/* Branch Location Field */}
          <div className="space-y-2">
            <label
              htmlFor="branchLocation"
              className="block text-sm font-medium text-gray-700"
            >
              Branch Location
            </label>
            <div className="relative">
              <select
                id="branchLocation"
                value={branchLocation}
                onChange={(e) => setBranchLocation(e.target.value)}
                className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                required
              >
                <option value="">Select Branch</option>
                {BRANCHES.map((branch) => (
                  <option key={branch.id} value={branch.name}>
                    {branch.name}
                  </option>
                ))}
              </select>
              <MapPin className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Request Items Section */}
        <div className="mb-8 ml-2.5">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
            <ClipboardList className="mr-2 h-5 w-5" />
            Request Items
          </h2>

          <div className="space-y-4">
            {requestItems.map((item, index) => (
              <div key={index} className="bg-gray-50 p-4 rounded-lg relative">
                {requestItems.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="absolute top-3 right-3 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                )}

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                  {/* SKU/CODE Dropdown */}
                  <div className="md:col-span-2 space-y-2">
                    <label
                      htmlFor={`sku-${index}`}
                      className="text-sm font-medium text-gray-700 flex items-center"
                    >
                      <Package className="h-4 w-4 mr-1" />
                      SKU/CODE
                    </label>
                    <div className="relative">
                      <select
                        id={`sku-${index}`}
                        value={item.sku}
                        onChange={(e) =>
                          handleItemChange(index, "sku", e.target.value)
                        }
                        className="w-full p-2 pl-10 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none"
                        required
                      >
                        <option value="">Select Product</option>
                        {PRODUCTS.map((product) => (
                          <option key={product.sku} value={product.sku}>
                            {product.sku} - {product.category}
                          </option>
                        ))}
                      </select>
                      <Box className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                      <ChevronDown className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
                    </div>
                  </div>

                  {/* Product Name */}
                  <div className="md:col-span-2 space-y-2">
                    <label
                      htmlFor={`productName-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Product Name
                    </label>
                    <input
                      type="text"
                      id={`productName-${index}`}
                      value={item.productName}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100"
                    />
                  </div>

                  {/* Quantity */}
                  <div className="space-y-2">
                    <label
                      htmlFor={`quantity-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Quantity
                    </label>
                    <input
                      type="number"
                      id={`quantity-${index}`}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(
                          index,
                          "quantity",
                          parseInt(e.target.value) || 0
                        )
                      }
                      min="1"
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>

                  {/* Urgency */}
                  <div className="space-y-2">
                    <label
                      htmlFor={`urgency-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Urgency
                    </label>
                    <select
                      id={`urgency-${index}`}
                      value={item.urgency}
                      onChange={(e) =>
                        handleItemChange(index, "urgency", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>

                  {/* Reason */}
                  <div className="md:col-span-6 space-y-2">
                    <label
                      htmlFor={`reason-${index}`}
                      className="block text-sm font-medium text-gray-700"
                    >
                      Reason for Request
                    </label>
                    <input
                      type="text"
                      id={`reason-${index}`}
                      value={item.reason}
                      onChange={(e) =>
                        handleItemChange(index, "reason", e.target.value)
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="button"
            onClick={addItem}
            className="mt-4 flex items-center text-blue-600 hover:text-blue-800 text-sm font-medium"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Another Item
          </button>
        </div>

        {/* Notes Field */}
        <div className="mb-8 space-y-2 ml-2.5">
          <label
            htmlFor="notes"
            className="text-sm font-medium text-gray-700 flex items-center"
          >
            <AlertCircle className="h-5 w-5 mr-2 text-gray-500" />
            Notes for Requesting Branch
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="Any special instructions or notes for the branch you're requesting from..."
          />
        </div>

        {/* Status Message */}
        {submitStatus && (
          <div
            className={`mb-6 p-4 rounded-md ${
              submitStatus.success
                ? "bg-green-50 text-green-800"
                : "bg-red-50 text-red-800"
            }`}
          >
            <div className="flex items-center">
              {submitStatus.success ? (
                <CheckCircle2 className="h-5 w-5 mr-2" />
              ) : (
                <XCircle className="h-5 w-5 mr-2" />
              )}
              <span>{submitStatus.message}</span>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors ${
              isSubmitting ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {isSubmitting ? (
              <span className="flex items-center">
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Submitting...
              </span>
            ) : (
              "Submit Request"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
