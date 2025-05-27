import "./index.css";
import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Login from "./components/Aut/Login";
import ProtectedRoute from "./components/Aut/ProtectedRoute";
import AddUser from "./components/Branch-Manager-SuperAdmin/AddUser";
import UserManagement from "./components/Branch-Manager-SuperAdmin/UserManagement";
import Branch_category from "./components/Branch/Branch_category";
import Branch_location from "./components/Branch/Branch_location";
import ProductTable from "./components/Branch/ProductTable";
import Request_product from "./components/Branch/Request_product";
import Pending_request from "./components/Branch_Request/Pending_request";
import Dashboard from "./components/Dashboard/Dashboard";
import Sidebar from "./components/Sidebar/Sidebar";
import {
  SidebarProvider,
  useSidebar,
} from "./components/Sidebar/SidebarContext";
import Unauthorized from "./components/Unauthorized/Unauthorized";
import Transferred from "./components/Branch_Request/Transffered";
import AllStock from "./components/Stock_Components/All_Stock";
import ProductDetails from "./components/Stock_Components/ProductDetails";
import Send_Request from "./components/Branch_Request/Send_Request";
import Sales from "./components/Sales/Sales";

// Define props for Layout component
interface LayoutProps {
  children: React.ReactNode;
}

// Define user roles type
type UserRole = "admin" | "branchManager" | "superAdmin";

// Define allowed roles for each route
const routeRoles: Record<string, UserRole[]> = {
  dashboard: ["admin", "branchManager", "superAdmin"],
  branchLocation: ["admin", "branchManager", "superAdmin"],
  branchProducts: ["admin", "branchManager", "superAdmin"],
  branchCategory: ["admin", "branchManager", "superAdmin"],
  requestProduct: ["admin", "branchManager", "superAdmin"],
  send_request: ["admin", "branchManager", "superAdmin"],
  sales: ["admin", "branchManager", "superAdmin"],
  pendingRequest: ["branchManager", "superAdmin"],
  transferred: ["admin", "branchManager", "superAdmin"],
  awaitingApproval: ["branchManager", "superAdmin"],
  allStock: ["admin", "branchManager", "superAdmin"],
  productDetails: ["admin", "branchManager", "superAdmin"],
  addUser: ["superAdmin", "branchManager"],
  userManagement: ["superAdmin", "branchManager"],
};

// Layout component that includes the Sidebar
const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { isCollapsed } = useSidebar();

  return (
    <div style={{ display: "flex" }}>
      <Sidebar />
      <div
        style={{
          flex: 1,
          marginLeft: isCollapsed ? "80px" : "256px",
          transition: "margin-left 0.3s ease",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <SidebarProvider>
      <Router>
        <Routes>
          {/* Public Route: Login Page */}
          <Route path="/" element={<Login />} />

          {/* Protected Routes */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute allowedRoles={routeRoles.dashboard}>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/branch_location"
            element={
              <ProtectedRoute allowedRoles={routeRoles.branchLocation}>
                <Layout>
                  <Branch_location />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/branch_products"
            element={
              <ProtectedRoute allowedRoles={routeRoles.branchProducts}>
                <Layout>
                  <ProductTable />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/branch_category"
            element={
              <ProtectedRoute allowedRoles={routeRoles.branchCategory}>
                <Layout>
                  <Branch_category />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/send_request"
            element={
              <ProtectedRoute allowedRoles={routeRoles.send_request}>
                <Layout>
                  <Send_Request />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/request_product/:productId"
            element={
              <ProtectedRoute allowedRoles={routeRoles.requestProduct}>
                <Layout>
                  <Request_product />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/pending_request"
            element={
              <ProtectedRoute allowedRoles={routeRoles.pendingRequest}>
                <Layout>
                  <Pending_request />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/transferred"
            element={
              <ProtectedRoute allowedRoles={routeRoles.transferred}>
                <Layout>
                  <Transferred />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/sales"
            element={
              <ProtectedRoute allowedRoles={routeRoles.allStock}>
                <Layout>
                  <Sales />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/all_stock"
            element={
              <ProtectedRoute allowedRoles={routeRoles.allStock}>
                <Layout>
                  <AllStock />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/product/:productId"
            element={
              <ProtectedRoute allowedRoles={routeRoles.productDetails}>
                <Layout>
                  <ProductDetails />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-user"
            element={
              <ProtectedRoute allowedRoles={routeRoles.addUser}>
                <Layout>
                  <AddUser />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-management/:userId"
            element={
              <ProtectedRoute allowedRoles={routeRoles.userManagement}>
                <Layout>
                  <UserManagement />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Public Route: Unauthorized Page */}
          <Route path="/unauthorized" element={<Unauthorized />} />

          {/* Redirect to /dashboard if no route matches */}
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </Router>
    </SidebarProvider>
  );
};

export default App;
