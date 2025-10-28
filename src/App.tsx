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
import SetupAccount from "./components/Aut/SetupAccount";
import ResetPassword from "./components/Aut/ResetPassword";
import AddUser from "./components/Branch-Manager-SuperAdmin/AddUser";
import UserManagement from "./components/Branch-Manager-SuperAdmin/UserManagement";
import AdminBranchManagement from "./components/Branch-Manager-SuperAdmin/AdminBranchManagement";
import Branch_location from "./components/Branch/Branch_location";
import Pending_request from "./components/Branch_Request/Pending_request";
import Dashboard from "./components/Dashboard/Dashboard";
import Sidebar from "./components/Sidebar/Sidebar";
import {
  SidebarProvider,
  useSidebar,
} from "./components/Sidebar/SidebarContext";
import Unauthorized from "./components/Unauthorized/Unauthorized";
import Transferred from "./components/Branch_Request/Transffered";
import AllStock from "./components/Stock_Components/OptimizedAll_Stock";
import Sales from "./components/Sales/Sales";
import Requested_Item from "./components/Branch_Request/Requested_Item";
import UnifiedProductRequest from "./components/Branch/UnifiedProductRequest";
import ProductTable from "./components/Branch/ProductTable";
import AddCategoryPage from "./components/Branch-Manager-SuperAdmin/AddCategoryPage";
import AuditLogsPage from "./components/AuditLogs/AuditLogsPage";
import UserAuditLogsPage from "./components/AuditLogs/UserAuditLogsPage";
import SessionWarning from "./components/SessionWarning";
import { ThemeProvider } from "./components/ThemeContext/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";
import { RouteRoles } from "./types";
import UserAuditLogsDetailView from "./components/AuditLogs/UserAuditLogsDetailView";

// Define props for Layout component
interface LayoutProps {
  children: React.ReactNode;
}

// Define allowed roles for each route
const routeRoles: RouteRoles = {
  dashboard: ["Admin", "Branch Manager", "Super Admin"],
  branchLocation: ["Admin", "Branch Manager", "Super Admin"],
  branchProducts: ["Admin", "Branch Manager", "Super Admin"],
  branchCategory: ["Admin", "Branch Manager", "Super Admin"],
  add_category: ["Admin", "Branch Manager", "Super Admin"],
  add_branch: ["Admin", "Super Admin"],
  view_product: ["Admin", "Branch Manager", "Super Admin"],
  send_request: ["Admin", "Branch Manager", "Super Admin"],
  sales: ["Admin", "Branch Manager", "Super Admin"],
  pendingRequest: ["Branch Manager", "Super Admin"],
  transferred: ["Admin", "Branch Manager", "Super Admin"],
  awaitingApproval: ["Branch Manager", "Super Admin"],
  allStock: ["Admin", "Branch Manager", "Super Admin"],
  productDetails: ["Admin", "Branch Manager", "Super Admin"],
  addUser: ["Super Admin", "Branch Manager"],
  userManagement: ["Super Admin", "Branch Manager"],
  branchManagement: ["Super Admin", "Admin"],
  auditlogs: ["Super Admin", "Branch Manager"],
  myActivity: ["Admin", "Branch Manager", "Super Admin"],
  UserAuditLogDetails: ["Admin", "Branch Manager", "Super Admin"],
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
      <SessionWarning />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <SidebarProvider>
          <Router>
            <Routes>
              {/* Public Route: Login Page */}
              <Route path="/" element={<Login />} />

              {/* Public Route: Setup Account Page */}
              <Route path="/setup-account" element={<SetupAccount />} />

              {/* Public Route: Reset Password Page */}
              <Route path="/reset-password" element={<ResetPassword />} />

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
                path="/branch_products/:branchId"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.branchProducts}>
                    <Layout>
                      <ProductTable />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* AddCategoryPage */}
              <Route
                path="/categories/add"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.add_category}>
                    <Layout>
                      <AddCategoryPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              {/* Unified Product Request */}
              <Route
                path="/unified_products/:branchId"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.send_request}>
                    <Layout>
                      <UnifiedProductRequest />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/requested_item"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.send_request}>
                    <Layout>
                      <Requested_Item />
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
              {/* Sales */}
              <Route
                path="/sales"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.sales}>
                    <Layout>
                      <Sales />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              {/* Stock_Components */}
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
                path="/user-management"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.userManagement}>
                    <Layout>
                      <UserManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/branch-management"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.branchManagement}>
                    <Layout>
                      <AdminBranchManagement />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/auditlogs"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.auditlogs}>
                    <Layout>
                      <AuditLogsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />

              <Route
                path="/my-activity"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.myActivity}>
                    <Layout>
                      <UserAuditLogsPage />
                    </Layout>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/user-audit-log-details/:id"
                element={
                  <ProtectedRoute allowedRoles={routeRoles.myActivity}>
                    <Layout>
                      <UserAuditLogsDetailView />
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
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
