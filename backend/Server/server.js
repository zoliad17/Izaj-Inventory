const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const { createClient } = require("@supabase/supabase-js");
const { supabase } = require("./supabase.node.js");
const { sendSetupEmail, sendResetPasswordEmail, sendRequestNotificationEmail, sendRequestStatusEmail } = require("./utils/emailService");
const { validateRequest, schemas } = require("./utils/validation");
const { rateLimits, securityHeaders, corsOptions, requestLogger, errorHandler, requestSizeLimiter, authenticateUser } = require("./utils/security");

// Helper function to create informative audit log messages
const createAuditMessage = (action, context) => {
  const messages = {
    'USER_LOGIN': `User ${context.userName} (${context.userEmail}) successfully logged in from ${context.branchLocation || 'Unknown Branch'} at ${new Date().toLocaleTimeString()}`,
    'USER_SETUP_COMPLETED': `New user ${context.userName} (${context.userEmail}) completed account setup and was assigned role '${context.roleName}' for ${context.branchLocation || 'Unknown Branch'}`,
    'PRODUCT_REQUEST_CREATED': `Product requisition request #${context.requestId} was created by ${context.userName} (${context.userEmail}) from ${context.branchLocation || 'Unknown Branch'} requesting ${context.itemCount} items with total quantity of ${context.totalQuantity} units`,
    'PRODUCT_REQUEST_APPROVED': `Product requisition request #${context.requestId} was approved by ${context.reviewerName} (${context.reviewerRole}) from ${context.reviewerBranch || 'Unknown Branch'}. Request contained ${context.itemCount} items with total quantity of ${context.totalQuantity} units`,
    'PRODUCT_REQUEST_DENIED': `Product requisition request #${context.requestId} was denied by ${context.reviewerName} (${context.reviewerRole}) from ${context.reviewerBranch || 'Unknown Branch'}. Request contained ${context.itemCount} items with total quantity of ${context.totalQuantity} units`,
    'PRODUCT_ADDED': `New product '${context.productName}' was added to ${context.branchLocation || 'Unknown Branch'} with initial quantity of ${context.quantity} units at $${context.price} per unit`,
    'PRODUCT_UPDATED': `Product '${context.productName}' (ID: ${context.productId}) was updated in ${context.branchLocation || 'Unknown Branch'}. Changes: ${context.changes}`,
    'PRODUCT_DELETED': `Product '${context.productName}' (ID: ${context.productId}) was deleted from ${context.branchLocation || 'Unknown Branch'} by ${context.userName}`,
    'USER_CREATED': `New user ${context.userName} (${context.userEmail}) was created with role '${context.roleName}' for ${context.branchLocation || 'Unknown Branch'}`,
    'USER_UPDATED': `User ${context.userName} (${context.userEmail}) profile was updated. Changes: ${context.changes}`,
    'USER_DELETED': `User ${context.userName} (${context.userEmail}) was deleted from the system`,
    'BRANCH_CREATED': `New branch '${context.branchName}' was created at ${context.branchAddress || 'Unknown Address'}`,
    'BRANCH_UPDATED': `Branch '${context.branchName}' information was updated. Changes: ${context.changes}`,
    'CATEGORY_CREATED': `New product category '${context.categoryName}' was created`,
    'CATEGORY_UPDATED': `Product category '${context.categoryName}' was updated. Changes: ${context.changes}`,
    'CATEGORY_DELETED': `Product category '${context.categoryName}' was deleted`
  };

  return messages[action] || `Action '${action}' was performed by ${context.userName || 'Unknown User'}`;
};

const path = require('path');
const envPath = path.join(__dirname, '../../.env');
const envLocalPath = path.join(__dirname, '../../.env.local');

if (require('fs').existsSync(envPath)) {
  require("dotenv").config({ path: envPath });
} else if (require('fs').existsSync(envLocalPath)) {
  require("dotenv").config({ path: envLocalPath });
} else {
  console.log('No .env file found, using default values');
}

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_PORT = process.env.FRONTEND_PORT || '5173';
const FRONTEND_URL = process.env.FRONTEND_URL || `http://localhost:${FRONTEND_PORT}`;

// Security middleware
app.use(securityHeaders);
app.use(cors(corsOptions));
app.use(requestLogger);
app.use(requestSizeLimiter('10mb'));

// Body parsing middleware
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '10mb' }));

// General rate limiting
app.use(rateLimits.general);

// GET all products from Supabase (filtered by branch_id)
app.get("/api/products", rateLimits.stockMonitoring, async (req, res) => {
  let branchId = req.query.branch_id;
  if (!branchId) {
    return res.status(400).json({ error: "branch_id is required" });
  }
  branchId = Number(branchId); // ensure branchId is a number
  const { data, error } = await supabase
    .from("centralized_product")
    .select(
      `
      id,
      product_name,
      quantity,
      price,
      status,
      branch_id,
      category_id,
      category:category_id (
        id,
        category_name
      )
    `
    )
    .eq("branch_id", branchId);
  if (error) return res.status(500).json({ error: error.message });
  // Map category name to top-level for frontend
  const mapped = data.map((product) => ({
    ...product,
    category_name: product.category?.category_name || "",
  }));
  res.json(mapped);
});

// POST add new product to Supabase (with authentication)
app.post("/api/products", rateLimits.productOps, authenticateUser, validateRequest(schemas.product), async (req, res) => {
  const product = req.body;
  const user = req.user; // Get authenticated user from middleware

  // Debug logging
  console.log("Received product data:", JSON.stringify(product, null, 2));
  console.log("Authenticated user:", user.name, "(", user.email, ")");

  // Build a clean insert payload explicitly
  const insertPayload = {
    product_name: product.name,
    category_id: product.category,
    price: Number(product.price),
    quantity: Number(product.stock),
    status: product.status,
    branch_id: product.branch_id,
  };

  console.log("Insert payload:", JSON.stringify(insertPayload, null, 2));

  const { data, error } = await supabase
    .from("centralized_product")
    .insert([insertPayload])
    .select();

  if (error) {
    console.error("Error inserting product:", error);
    return res.status(500).json({ error: error.message });
  }

  // Log product creation with authenticated user
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert([{
      user_id: user.user_id, // Use authenticated user ID
      action: "PRODUCT_CREATED",
      description: `Product "${product.name}" created in branch ${product.branch_id} by ${user.name}`,
      entity_type: "centralized_product",
      entity_id: data[0].id.toString(),
      metadata: {
        product_name: product.name,
        category_id: product.category,
        price: Number(product.price),
        quantity: Number(product.stock),
        status: product.status,
        branch_id: product.branch_id,
        created_by: user.name,
        created_by_email: user.email
      },
      new_values: {
        product_name: product.name,
        category_id: product.category,
        price: Number(product.price),
        quantity: Number(product.stock),
        status: product.status,
        branch_id: product.branch_id
      }
    }]);

  if (auditError) {
    console.error("Error logging product creation audit trail:", auditError);
  }

  res.status(201).json(data[0]);
});

// PUT update product in Supabase (with authentication)
app.put("/api/products/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const product = req.body;
  const user = req.user; // Get authenticated user from middleware

  console.log("Updating product:", id, "by user:", user.name, "(", user.email, ")");

  const { data, error } = await supabase
    .from("centralized_product")
    .update({
      product_name: product.name,
      category_id: product.category, // already int
      price: Number(product.price),
      quantity: Number(product.stock),
      status: product.status,
      branch_id: product.branch_id, // already int
      // Add other fields as needed
    })
    .eq("id", id) // id is int from params
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "Product not found" });

  // Log product update with authenticated user
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert([{
      user_id: user.user_id, // Use authenticated user ID
      action: "PRODUCT_UPDATED",
      description: `Product "${product.name}" updated by ${user.name}`,
      entity_type: "centralized_product",
      entity_id: id,
      metadata: {
        product_name: product.name,
        category_id: product.category,
        price: Number(product.price),
        quantity: Number(product.stock),
        status: product.status,
        branch_id: product.branch_id,
        updated_by: user.name,
        updated_by_email: user.email
      },
      new_values: {
        product_name: product.name,
        category_id: product.category,
        price: Number(product.price),
        quantity: Number(product.stock),
        status: product.status,
        branch_id: product.branch_id
      }
    }]);

  if (auditError) {
    console.error("Error logging product update audit trail:", auditError);
  }

  res.json(data[0]);
});

// POST bulk import/upsert products (with authentication)
app.post("/api/products/bulk-import", rateLimits.productOps, authenticateUser, async (req, res) => {
  try {
    const { products, user_id } = req.body;
    const user = req.user; // Get authenticated user from middleware

    if (!products || !Array.isArray(products) || products.length === 0) {
      return res.status(400).json({ error: "Products array is required and cannot be empty" });
    }

    console.log(`Bulk importing ${products.length} products by user: ${user.name} (${user.email})`);

    const results = {
      created: 0,
      updated: 0,
      errors: [],
      total: products.length
    };

    // Log zero quantity products for debugging
    const zeroQuantityProducts = products.filter(p => p.stock === 0);
    if (zeroQuantityProducts.length > 0) {
      console.log(`Found ${zeroQuantityProducts.length} products with zero quantity:`,
        zeroQuantityProducts.map(p => p.name));
    }

    // Process products in batches to avoid overwhelming the database
    const batchSize = 10;
    for (let i = 0; i < products.length; i += batchSize) {
      const batch = products.slice(i, i + batchSize);

      for (const product of batch) {
        try {
          // Check if product exists in the same branch
          const { data: existingProduct, error: checkError } = await supabase
            .from("centralized_product")
            .select("id, quantity, product_name, price, category_id, status")
            .eq("product_name", product.name)
            .eq("branch_id", product.branch_id)
            .single();

          if (checkError && checkError.code !== 'PGRST116') {
            results.errors.push(`Error checking product "${product.name}": ${checkError.message}`);
            continue;
          }

          if (existingProduct) {
            // Update existing product - add to existing quantity
            const newQuantity = existingProduct.quantity + product.stock;
            const newStatus = newQuantity === 0 ? 'Out of Stock' :
              newQuantity < 20 ? 'Low Stock' : 'In Stock';

            const { error: updateError } = await supabase
              .from("centralized_product")
              .update({
                quantity: newQuantity,
                price: Number(product.price),
                status: newStatus,
                category_id: product.category
              })
              .eq("id", existingProduct.id);

            if (updateError) {
              results.errors.push(`Error updating product "${product.name}": ${updateError.message}`);
            } else {
              results.updated++;

              // Log update in audit trail
              await supabase
                .from("audit_logs")
                .insert([{
                  user_id: user.user_id,
                  action: "PRODUCT_UPDATED",
                  description: `Product "${product.name}" updated via bulk import by ${user.name}`,
                  entity_type: "centralized_product",
                  entity_id: existingProduct.id.toString(),
                  metadata: {
                    product_name: product.name,
                    category_id: product.category,
                    price: Number(product.price),
                    quantity_added: product.stock,
                    new_quantity: newQuantity,
                    new_status: newStatus,
                    branch_id: product.branch_id,
                    updated_by: user.name,
                    updated_by_email: user.email,
                    import_source: "bulk_excel_import"
                  },
                  new_values: {
                    quantity: newQuantity,
                    price: Number(product.price),
                    status: newStatus,
                    category_id: product.category
                  }
                }]);
            }
          } else {
            // Create new product
            const status = product.stock === 0 ? 'Out of Stock' :
              product.stock < 20 ? 'Low Stock' : 'In Stock';

            const { data: newProduct, error: createError } = await supabase
              .from("centralized_product")
              .insert([{
                product_name: product.name,
                category_id: product.category,
                price: Number(product.price),
                quantity: product.stock,
                status: status,
                branch_id: product.branch_id,
                reserved_quantity: 0
              }])
              .select()
              .single();

            if (createError) {
              results.errors.push(`Error creating product "${product.name}": ${createError.message}`);
            } else {
              results.created++;

              // Log creation in audit trail
              await supabase
                .from("audit_logs")
                .insert([{
                  user_id: user.user_id,
                  action: "PRODUCT_CREATED",
                  description: `Product "${product.name}" created via bulk import by ${user.name}`,
                  entity_type: "centralized_product",
                  entity_id: newProduct.id.toString(),
                  metadata: {
                    product_name: product.name,
                    category_id: product.category,
                    price: Number(product.price),
                    quantity: product.stock,
                    status: status,
                    branch_id: product.branch_id,
                    created_by: user.name,
                    created_by_email: user.email,
                    import_source: "bulk_excel_import"
                  },
                  new_values: {
                    product_name: product.name,
                    category_id: product.category,
                    price: Number(product.price),
                    quantity: product.stock,
                    status: status,
                    branch_id: product.branch_id
                  }
                }]);
            }
          }
        } catch (error) {
          results.errors.push(`Error processing product "${product.name}": ${error.message}`);
        }
      }
    }

    // Log bulk import summary
    await supabase
      .from("audit_logs")
      .insert([{
        user_id: user.user_id,
        action: "BULK_IMPORT_COMPLETED",
        description: `Bulk import completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
        entity_type: "bulk_operation",
        entity_id: "bulk_import_" + Date.now(),
        metadata: {
          total_products: results.total,
          created_count: results.created,
          updated_count: results.updated,
          error_count: results.errors.length,
          errors: results.errors.slice(0, 10), // Limit to first 10 errors
          branch_id: products[0]?.branch_id,
          imported_by: user.name,
          imported_by_email: user.email
        }
      }]);

    res.json({
      success: true,
      message: `Bulk import completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`,
      results
    });

  } catch (error) {
    console.error("Error in bulk import:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE product from Supabase (with authentication and cascading delete)
app.delete("/api/products/:id", authenticateUser, async (req, res) => {
  const { id } = req.params;
  const user = req.user; // Get authenticated user from middleware

  console.log("Deleting product:", id, "by user:", user.name, "(", user.email, ")");

  try {
    // First get product info for audit logging
    const { data: productData, error: fetchError } = await supabase
      .from("centralized_product")
      .select("product_name, branch_id")
      .eq("id", parseInt(id, 10))
      .single();

    if (fetchError) {
      console.error("Error fetching product for deletion:", fetchError);
      return res.status(500).json({ error: "Failed to fetch product information" });
    }

    if (!productData) {
      return res.status(404).json({ error: "Product not found" });
    }

    // Check if product has active requests
    const { data: activeRequests, error: requestCheckError } = await supabase
      .from("product_requisition_items")
      .select(`
        id,
        request_id,
        product_requisition!inner(
          request_id,
          status,
          created_at
        )
      `)
      .eq("product_id", parseInt(id, 10));

    if (requestCheckError) {
      console.error("Error checking active requests:", requestCheckError);
      return res.status(500).json({ error: "Failed to check product dependencies" });
    }

    // Filter for pending/approved requests only
    const pendingRequests = activeRequests?.filter(item =>
      item.product_requisition?.status === 'pending' ||
      item.product_requisition?.status === 'approved'
    ) || [];

    if (pendingRequests.length > 0) {
      return res.status(409).json({
        error: "Cannot delete product",
        message: `Product "${productData.product_name}" has ${pendingRequests.length} active request(s) and cannot be deleted. Please complete or cancel the requests first.`,
        details: {
          product_name: productData.product_name,
          active_requests: pendingRequests.length,
          request_ids: pendingRequests.map(req => req.request_id)
        }
      });
    }

    // If there are only completed/denied requests, we can safely delete them first
    if (activeRequests && activeRequests.length > 0) {
      console.log(`Deleting ${activeRequests.length} completed/denied request items for product ${id}`);

      // Delete related request items first
      const { error: deleteItemsError } = await supabase
        .from("product_requisition_items")
        .delete()
        .eq("product_id", parseInt(id, 10));

      if (deleteItemsError) {
        console.error("Error deleting related request items:", deleteItemsError);
        return res.status(500).json({ error: "Failed to clean up related request items" });
      }
    }

    // Now delete the product
    const { error: deleteError } = await supabase
      .from("centralized_product")
      .delete()
      .eq("id", parseInt(id, 10));

    if (deleteError) {
      console.error("Error deleting product:", deleteError);
      return res.status(500).json({ error: deleteError.message });
    }

    // Log product deletion with authenticated user
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([{
        user_id: user.user_id,
        action: "PRODUCT_DELETED",
        description: `Product "${productData.product_name}" deleted by ${user.name}`,
        entity_type: "centralized_product",
        entity_id: id,
        metadata: {
          product_name: productData.product_name,
          branch_id: productData.branch_id,
          deleted_by: user.name,
          deleted_by_email: user.email,
          cleaned_up_requests: activeRequests?.length || 0
        }
      }]);

    if (auditError) {
      console.error("Error logging product deletion audit trail:", auditError);
    }

    res.status(204).send();

  } catch (error) {
    console.error("Unexpected error during product deletion:", error);
    res.status(500).json({ error: "Internal server error during product deletion" });
  }
});

// LOGIN endpoint for Express backend
app.post("/api/login", rateLimits.login, validateRequest(schemas.login), async (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt:", { email, password: "***" });

  try {
    // Get user from database
    const { data, error } = await supabase
      .from("user")
      .select("*, role:role_id(role_name), branch_id")
      .eq("email", email)
      .maybeSingle();

    if (error) return res.status(500).json({ error: error.message });
    if (!data)
      return res.status(401).json({ error: "Invalid email or password" });
    if (!data.role || !data.role.role_name)
      return res.status(500).json({ error: "User role information is missing" });

    // Verify password using bcrypt
    const isValidPassword = await bcrypt.compare(password, data.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    // Log successful login
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([{
        user_id: data.user_id,
        action: "USER_LOGIN",
        description: `User ${data.name} (${data.email}) logged in successfully`,
        entity_type: "user",
        entity_id: data.user_id,
        metadata: {
          user_role: data.role.role_name,
          branch_id: data.branch_id,
          login_method: 'email_password'
        }
      }]);

    if (auditError) {
      console.error("Error logging login audit trail:", auditError);
    }

    res.json({
      user: data,
      role: data.role.role_name,
      branchId: data.branch_id || null,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// GET all users from Supabase (filtered by branch_id)
app.get("/api/users", rateLimits.userManagement, async (req, res) => {
  let branchId = req.query.branch_id;
  if (!branchId) {
    return res.status(400).json({ error: "branch_id is required" });
  }
  branchId = Number(branchId); // ensure branchId is a number
  const { data, error } = await supabase
    .from("user")
    .select("*, role:role_id(role_name)")
    .eq("branch_id", branchId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET all categories from Supabase
app.get("/api/categories", async (req, res) => {
  const { data, error } = await supabase.from("category").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET all roles from Supabase
app.get("/api/roles", async (req, res) => {
  const { data, error } = await supabase.from("role").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// POST validate session
app.post("/api/validate-session", async (req, res) => {
  try {
    const { user_id } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "User ID is required" });
    }

    // Check if user exists and is active
    const { data: user, error } = await supabase
      .from("user")
      .select("user_id, status")
      .eq("user_id", user_id)
      .single();

    if (error || !user) {
      return res.status(404).json({ error: "User not found" });
    }

    if (user.status?.toLowerCase() !== "active") {
      return res.status(403).json({ error: "User account is not active" });
    }

    res.json({ valid: true, user_id: user.user_id });
  } catch (error) {
    console.error("Error validating session:", error);
    res.status(500).json({ error: "Failed to validate session" });
  }
});

// Simple test endpoint to verify server is running
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// ==================== PRODUCT REQUEST ENDPOINTS ====================

// GET all branches for request dropdown
app.get("/api/branches", rateLimits.userManagement, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("branch")
      .select("id, location, address, latitude, longitude, map_snapshot_url")
      .order("location");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT update branch by ID
app.put("/api/branches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { location, address, latitude, longitude, map_snapshot_url } = req.body;

    if (!location || !address) {
      return res.status(400).json({ error: "location and address are required" });
    }

    const { data, error } = await supabase
      .from("branch")
      .update({
        location,
        address,
        latitude: latitude || null,
        longitude: longitude || null,
        map_snapshot_url: map_snapshot_url || null
      })
      .eq("id", id)
      .select("id, location, address, latitude, longitude, map_snapshot_url")
      .single();

    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: "Branch not found" });
    }

    res.json(data);
  } catch (error) {
    console.error("Error updating branch:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE branch by ID
app.delete("/api/branches/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from("branch").delete().eq("id", id);

    if (error) throw error;
    res.json({ message: "Branch deleted successfully" });
  } catch (error) {
    console.error("Error deleting branch:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET products from a specific branch (for requests)
app.get("/api/branches/:branchId/products", rateLimits.stockMonitoring, async (req, res) => {
  try {
    const { branchId } = req.params;
    const { data, error } = await supabase
      .from("centralized_product")
      .select(`
        id,
        product_name,
        quantity,
        reserved_quantity,
        price,
        status,
        category_id,
        category:category_id (
          id,
          category_name
        )
      `)
      .eq("branch_id", branchId)
      .gt("quantity", 0); // Only show products with stock

    if (error) throw error;

    const mapped = data.map((product) => {
      const availableQuantity = product.quantity - (product.reserved_quantity || 0);
      return {
        ...product,
        quantity: availableQuantity, // Show available quantity instead of total
        total_quantity: product.quantity, // Keep original total for reference
        reserved_quantity: product.reserved_quantity || 0,
        category_name: product.category?.category_name || "",
      };
    });

    res.json(mapped);
  } catch (error) {
    console.error("Error fetching branch products:", error);
    res.status(500).json({ error: error.message });
  }
});

// POST create product request
app.post("/api/product-requests", rateLimits.productRequests, validateRequest(schemas.productRequest), async (req, res) => {
  try {
    const { requestFrom, requestTo, items, notes } = req.body;

    // Validate required fields
    if (!requestFrom || !requestTo || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check and reserve inventory for all items in one query
    const productIds = items.map(item => item.product_id);
    const { data: productsData, error: fetchError } = await supabase
      .from("centralized_product")
      .select("id, quantity, reserved_quantity")
      .in("id", productIds);

    if (fetchError) throw fetchError;

    // Create a map for quick lookup
    const productMap = new Map(productsData.map(p => [p.id, p]));

    // Validate inventory for each item
    for (const item of items) {
      const productData = productMap.get(item.product_id);
      if (!productData) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      const availableQuantity = productData.quantity - (productData.reserved_quantity || 0);

      if (availableQuantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient inventory for product ID ${item.product_id}. Available: ${availableQuantity}, Requested: ${item.quantity}`
        });
      }
    }

    // Create the main request
    const { data: requestData, error: requestError } = await supabase
      .from("product_requisition")
      .insert([{
        request_from: requestFrom,
        request_to: requestTo,
        status: "pending",
        notes: notes || null
      }])
      .select("request_id")
      .single();

    if (requestError) throw requestError;

    // Create request items
    const requestItems = items.map(item => ({
      request_id: requestData.request_id,
      product_id: item.product_id,
      quantity: item.quantity
    }));

    const { error: itemsError } = await supabase
      .from("product_requisition_items")
      .insert(requestItems);

    if (itemsError) throw itemsError;

    // Reserve inventory by updating reserved_quantity ONLY (lean approach)
    // This stores the requested amount in reserved_quantity without changing quantity
    // Use the product data we already fetched for validation

    // Prepare batch updates
    const updates = items.map(item => {
      const productData = productMap.get(item.product_id);
      const currentReserved = productData?.reserved_quantity || 0;
      const newReservedQuantity = currentReserved + item.quantity;
      return {
        id: item.product_id,
        reserved_quantity: newReservedQuantity
      };
    });

    // Execute batch update - use individual updates since we're only updating reserved_quantity
    const updatePromises = updates.map(update =>
      supabase
        .from("centralized_product")
        .update({ reserved_quantity: update.reserved_quantity })
        .eq("id", update.id)
    );

    const updateResults = await Promise.all(updatePromises);
    const reserveError = updateResults.find(result => result.error)?.error;

    if (reserveError) {
      console.error("Error reserving inventory:", reserveError);
      throw new Error("Failed to reserve inventory");
    }

    // Get requester and recipient info for email
    const { data: requesterData } = await supabase
      .from("user")
      .select("name, email, branch_id")
      .eq("user_id", requestFrom)
      .single();

    const { data: recipientData } = await supabase
      .from("user")
      .select("name, email")
      .eq("user_id", requestTo)
      .single();

    // Send email notification
    if (recipientData?.email) {
      const emailResult = await sendRequestNotificationEmail(
        recipientData.email,
        recipientData.name,
        requesterData?.name || "Unknown",
        requestData.request_id
      );
      console.log("Request notification email result:", emailResult);
    }

    // Log audit trail
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([{
        user_id: requestFrom,
        action: "PRODUCT_REQUEST_CREATED",
        description: `Product request #${requestData.request_id} created with ${items.length} items`,
        entity_type: "product_requisition",
        entity_id: requestData.request_id,
        metadata: {
          request_to: requestTo,
          item_count: items.length,
          total_quantity: items.reduce((sum, item) => sum + item.quantity, 0),
          notes: notes || null
        },
        new_values: {
          items: items.map(item => ({
            product_id: item.product_id,
            quantity: item.quantity
          })),
          notes: notes || null
        }
      }]);

    if (auditError) {
      console.error("Error logging audit trail:", auditError);
    }

    res.status(201).json({
      success: true,
      request_id: requestData.request_id,
      message: "Product request created successfully"
    });

  } catch (error) {
    console.error("Error creating product request:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET pending requests for a user (incoming requests)
app.get("/api/product-requests/pending/:userId", rateLimits.productRequests, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("product_requisition")
      .select(`
        request_id,
        request_from,
        status,
        created_at,
        notes,
        requester:request_from (
          name,
          email,
          branch_id,
          branch:branch_id (
            location
          )
        ),
        items:product_requisition_items (
          id,
          quantity,
          product:product_id (
            id,
            product_name,
            quantity,
            price,
            category_id,
            category:category_id (
              category_name
            )
          )
        )
      `)
      .eq("request_to", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data for easier frontend consumption
    const transformedData = data.map(request => ({
      ...request,
      requester_branch: request.requester?.branch?.location || "Unknown Branch",
      items: request.items.map(item => ({
        ...item,
        product_name: item.product?.product_name || "Unknown Product",
        available_quantity: item.product?.quantity || 0,
        price: item.product?.price || 0,
        category_name: item.product?.category?.category_name || "Unknown Category"
      }))
    }));

    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching pending requests:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET sent requests for a user (outgoing requests)
app.get("/api/product-requests/sent/:userId", rateLimits.productRequests, async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from("product_requisition")
      .select(`
        request_id,
        request_to,
        status,
        created_at,
        updated_at,
        reviewed_at,
        notes,
        reviewer:reviewed_by (
          name
        ),
        recipient:request_to (
          name,
          branch_id,
          branch:branch_id (
            location
          )
        ),
        items:product_requisition_items (
          id,
          quantity,
          product:product_id (
            id,
            product_name,
            price,
            category_id,
            category:category_id (
              category_name
            )
          )
        )
      `)
      .eq("request_from", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data
    const transformedData = data.map(request => ({
      ...request,
      recipient_branch: request.recipient?.branch?.location || "Unknown Branch",
      reviewer_name: request.reviewer?.name || null,
      items: request.items.map(item => ({
        ...item,
        product_name: item.product?.product_name || "Unknown Product",
        price: item.product?.price || 0,
        category_name: item.product?.category?.category_name || "Unknown Category"
      }))
    }));

    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching sent requests:", error);
    res.status(500).json({ error: error.message });
  }
});

// PUT approve/deny product request
app.put("/api/product-requests/:requestId/review", rateLimits.productRequests, async (req, res) => {
  try {
    const { requestId } = req.params;
    const { action, reviewedBy, notes } = req.body; // action: 'approved' or 'denied'

    if (!action || !reviewedBy || !['approved', 'denied'].includes(action)) {
      return res.status(400).json({ error: "Invalid action or missing required fields" });
    }

    // Update the request status
    const { data: requestData, error: requestError } = await supabase
      .from("product_requisition")
      .update({
        status: action,
        reviewed_by: reviewedBy,
        reviewed_at: new Date().toISOString(),
        notes: notes || null
      })
      .eq("request_id", requestId)
      .select(`
        request_from,
        request_to,
        items:product_requisition_items (
          product_id,
          quantity
        )
      `)
      .single();

    if (requestError) throw requestError;

    // Handle inventory updates based on action
    if (action === 'approved') {
      // Get requester's branch_id
      const { data: requesterData, error: requesterError } = await supabase
        .from("user")
        .select("branch_id")
        .eq("user_id", requestData.request_from)
        .single();

      if (requesterError) {
        console.error("Error fetching requester data:", requesterError);
        return res.status(500).json({ error: "Failed to fetch requester information" });
      }

      // For approved requests: deduct reserved amount from quantity, reset reserved_quantity to 0, add to requester
      for (const item of requestData.items) {
        // First get current values from source branch
        const { data: productData, error: fetchError } = await supabase
          .from("centralized_product")
          .select("quantity, reserved_quantity, product_name, price, category_id, status")
          .eq("id", item.product_id)
          .single();

        if (fetchError) {
          console.error("Error fetching product data:", fetchError);
          continue;
        }

        // Calculate new values for source branch
        // Deduct the reserved amount from quantity and reset reserved_quantity to 0
        // Flow: reserved_quantity → quantity deduction → requester transfer
        const reservedAmount = item.quantity; // This is the amount that was reserved
        const newQuantity = Math.max(0, productData.quantity - reservedAmount);
        const newReservedQuantity = Math.max(0, (productData.reserved_quantity || 0) - reservedAmount);

        // Update source branch inventory
        const { error: updateError } = await supabase
          .from("centralized_product")
          .update({
            quantity: newQuantity,
            reserved_quantity: newReservedQuantity
          })
          .eq("id", item.product_id);

        if (updateError) {
          console.error("Error updating source product quantity:", updateError);
          continue;
        }

        // Add products to requester's branch
        // Check if product already exists in requester's branch
        const { data: existingProduct, error: checkError } = await supabase
          .from("centralized_product")
          .select("id, quantity")
          .eq("product_name", productData.product_name)
          .eq("branch_id", requesterData.branch_id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
          console.error("Error checking existing product in requester's branch:", checkError);
          continue;
        }

        if (existingProduct) {
          // Product exists in requester's branch - update quantity
          const { error: updateRequesterError } = await supabase
            .from("centralized_product")
            .update({
              quantity: existingProduct.quantity + reservedAmount
            })
            .eq("id", existingProduct.id);

          if (updateRequesterError) {
            console.error("Error updating product in requester's branch:", updateRequesterError);
          }
        } else {
          // Product doesn't exist in requester's branch - create new entry
          const { error: createError } = await supabase
            .from("centralized_product")
            .insert({
              product_name: productData.product_name,
              quantity: reservedAmount,
              price: productData.price,
              category_id: productData.category_id,
              status: productData.status,
              branch_id: requesterData.branch_id,
              reserved_quantity: 0
            });

          if (createError) {
            console.error("Error creating product in requester's branch:", createError);
          }
        }
      }

      // Log inventory transfer for approved requests
      const { error: transferAuditError } = await supabase
        .from("audit_logs")
        .insert([{
          user_id: reviewedBy,
          action: "INVENTORY_TRANSFER",
          description: `Approved request #${requestId}: Transferred ${requestData.items.length} items to requester's branch`,
          entity_type: "centralized_product",
          entity_id: requestId,
          metadata: {
            requester_id: requestData.request_from,
            requester_branch_id: requesterData.branch_id,
            items_transferred: requestData.items.map(item => ({
              product_name: item.product_name,
              quantity: item.quantity,
              product_id: item.product_id
            }))
          }
        }]);

      if (transferAuditError) {
        console.error("Error logging inventory transfer:", transferAuditError);
      }
    } else if (action === 'denied') {
      // For denied requests: simply reset reserved_quantity to 0 without altering quantity
      for (const item of requestData.items) {
        // First get current values
        const { data: productData, error: fetchError } = await supabase
          .from("centralized_product")
          .select("quantity, reserved_quantity")
          .eq("id", item.product_id)
          .single();

        if (fetchError) {
          console.error("Error fetching product data:", fetchError);
          continue;
        }

        // Calculate new values - only reset reserved_quantity to 0
        // Do NOT alter quantity field - this avoids double-counting
        const newReservedQuantity = 0; // Simply reset to 0, don't subtract

        // Update with calculated values - only update reserved_quantity
        const { error: restoreError } = await supabase
          .from("centralized_product")
          .update({
            reserved_quantity: newReservedQuantity
          })
          .eq("id", item.product_id);

        if (restoreError) {
          console.error("Error restoring reserved quantity:", restoreError);
          // Continue with other items even if one fails
        }
      }
    }

    // Get requester info for email notification
    const { data: requesterData } = await supabase
      .from("user")
      .select("name, email")
      .eq("user_id", requestData.request_from)
      .single();

    const { data: reviewerData } = await supabase
      .from("user")
      .select("name")
      .eq("user_id", reviewedBy)
      .single();

    // Send email notification
    if (requesterData?.email) {
      const emailResult = await sendRequestStatusEmail(
        requesterData.email,
        requesterData.name,
        action,
        requestId,
        reviewerData?.name || "Unknown",
        notes
      );
      console.log("Request status email result:", emailResult);
    }

    // Log audit trail with enhanced information
    const auditAction = action === 'approved' ? "PRODUCT_REQUEST_APPROVED" : "PRODUCT_REQUEST_DENIED";
    const auditContext = {
      requestId,
      reviewerName: reviewerData?.name || 'Unknown',
      reviewerRole: reviewerData?.role?.role_name || 'Unknown Role',
      reviewerBranch: reviewerData?.branch?.location || 'Unknown Branch',
      itemCount: requestData.items.length,
      totalQuantity: requestData.items.reduce((sum, item) => sum + item.quantity, 0)
    };

    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([{
        user_id: reviewedBy,
        action: auditAction,
        description: createAuditMessage(auditAction, auditContext),
        entity_type: "product_requisition",
        entity_id: requestId,
        metadata: {
          original_requester: requestData.request_from,
          requester_name: requestData.requester_name || 'Unknown',
          requester_branch: requestData.requester_branch || 'Unknown',
          item_count: requestData.items.length,
          total_quantity: requestData.items.reduce((sum, item) => sum + item.quantity, 0),
          reviewer_notes: notes || null,
          items_requested: requestData.items.map(item => ({
            product_name: item.product_name,
            quantity: item.quantity,
            product_id: item.product_id
          }))
        },
        old_values: {
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null,
          notes: null
        },
        new_values: {
          status: action,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          notes: notes || null
        },
        notes: notes ? `Reviewer notes: ${notes}` : null
      }]);

    if (auditError) {
      console.error("Error logging audit trail:", auditError);
    }

    res.json({
      success: true,
      message: `Request ${action} successfully`
    });

  } catch (error) {
    console.error("Error reviewing product request:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET pending requests for a specific branch (for Branch Managers)
app.get("/api/product-requests/pending-for-branch/:branchId", async (req, res) => {
  try {
    const { branchId } = req.params;

    // First, get the branch manager for this branch
    const { data: roleData } = await supabase
      .from("role")
      .select("id")
      .eq("role_name", "Branch Manager")
      .single();

    if (!roleData) {
      return res.status(404).json({ error: "Branch Manager role not found" });
    }

    const { data: branchManagerData } = await supabase
      .from("user")
      .select("user_id")
      .eq("branch_id", branchId)
      .eq("role_id", roleData.id)
      .single();

    if (!branchManagerData) {
      return res.status(404).json({ error: "No Branch Manager found for this branch" });
    }

    // Get pending requests for this branch manager
    const { data, error } = await supabase
      .from("product_requisition")
      .select(`
        request_id,
        request_from,
        status,
        created_at,
        notes,
        requester:request_from (
          name,
          email,
          branch_id,
          branch:branch_id (
            location
          )
        ),
        items:product_requisition_items (
          id,
          quantity,
          product:product_id (
            id,
            product_name,
            price,
            category_id,
            category:category_id (
              category_name
            )
          )
        )
      `)
      .eq("request_to", branchManagerData.user_id)
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data
    const transformedData = data.map(request => ({
      ...request,
      requester_branch: request.requester?.branch?.location || "Unknown Branch",
      items: request.items.map(item => ({
        ...item,
        product_name: item.product?.product_name || "Unknown Product",
        price: item.product?.price || 0,
        category_name: item.product?.category?.category_name || "Unknown Category"
      }))
    }));

    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching pending requests for branch:", error);
    res.status(500).json({ error: error.message });
  }
});

// Mark product request as arrived
app.put('/api/product-requests/:requestId/mark-arrived', async (req, res) => {
  const { requestId } = req.params;
  const { user_id, branch_id } = req.body;

  try {
    // Update request status to arrived
    const { data: requestData, error: requestError } = await supabase
      .from('product_requisition')  // Changed from product_requests to product_requisition
      .update({
        status: 'arrived',
        arrived_at: new Date().toISOString()
      })
      .eq('request_id', requestId)
      .select()
      .single();

    if (requestError) throw requestError;

    // Get the request items with product details
    const { data: items, error: itemsError } = await supabase
      .from('product_requisition_items')  // Get items from requisition items table
      .select(`
        product_id,
        quantity,
        product:product_id (
          product_name,
          category_id
        )
      `)
      .eq('request_id', requestId);

    if (itemsError) throw itemsError;

    if (items && items.length > 0) {
      // Create transfer records for each item
      const transferRecords = items.map(item => ({
        product_id: item.product_id,
        quantity: item.quantity,
        branch_id: branch_id,
        transferred_at: new Date().toISOString(),
        request_id: requestId,
        status: 'Completed'
      }));

      // Insert transfer records
      const { error: transferError } = await supabase
        .from('product_transfers')
        .insert(transferRecords);

      if (transferError) throw transferError;
    }

    res.json({
      success: true,
      message: 'Request marked as arrived and transfers recorded',
      data: requestData
    });

  } catch (error) {
    console.error('Error marking request as arrived:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simplified endpoint to fetch transferred products for a branch
app.get('/api/transfers/:branchId', async (req, res) => {
  const { branchId } = req.params;

  try {
    console.log(`Fetching transfers for branch ${branchId}`);

    // First, get all product transfers for this branch
    const { data: transfers, error: transferError } = await supabase
      .from('product_transfers')
      .select('*')
      .eq('branch_id', branchId)
      .order('transferred_at', { ascending: false });

    if (transferError) {
      console.error('Error fetching transfers:', transferError);
      return res.status(500).json({ error: 'Failed to fetch transfers: ' + transferError.message });
    }

    console.log(`Found ${transfers?.length || 0} transfers`);

    if (!transfers || transfers.length === 0) {
      return res.status(200).json([]);
    }

    // Get product details for each transfer
    const transformedItems = [];

    for (const transfer of transfers) {
      try {
        // Get product details
        const { data: product, error: productError } = await supabase
          .from('centralized_product')
          .select(`
            id,
            product_name,
            price,
            category_id,
            category:category_id (
              category_name
            )
          `)
          .eq('id', transfer.product_id)
          .single();

        if (productError) {
          console.error(`Error fetching product ${transfer.product_id}:`, productError);
          continue;
        }

        // Get request details to find the source branch
        const { data: request, error: requestError } = await supabase
          .from('product_requisition')
          .select(`
            request_from,
            request_to,
            user_from:request_from (
              name,
              branch_id,
              branch:branch_id (
                location
              )
            )
          `)
          .eq('request_id', transfer.request_id)
          .single();

        if (requestError) {
          console.error(`Error fetching request ${transfer.request_id}:`, requestError);
        }

        const transformedItem = {
          id: transfer.id,
          product_id: transfer.product_id,
          product: {
            product_name: product?.product_name || 'Unknown Product',
            category_name: product?.category?.category_name || 'Uncategorized',
            price: product?.price || 0
          },
          quantity: transfer.quantity || 0,
          status: transfer.quantity === 0 ? 'Out of Stock' :
            transfer.quantity < 20 ? 'Low Stock' : 'In Stock',
          transferred_from: request?.user_from?.branch?.location || 'Unknown Branch',
          transferred_at: transfer.transferred_at,
          request_id: transfer.request_id || 0,
          source: 'Transferred',
          total_value: (product?.price || 0) * (transfer.quantity || 0),
          requester_name: request?.user_from?.name || 'Unknown User',
          transfer_status: transfer.status || 'Completed'
        };

        transformedItems.push(transformedItem);
      } catch (itemError) {
        console.error(`Error processing transfer ${transfer.id}:`, itemError);
        continue;
      }
    }

    console.log(`Returning ${transformedItems.length} transformed items`);
    res.json(transformedItems);

  } catch (error) {
    console.error('Error in transfers endpoint:', error);
    res.status(500).json({
      error: 'Internal server error',
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// GET all requests (for Super Admin)
app.get("/api/product-requests/all", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("product_requisition")
      .select(`
        request_id,
        request_from,
        request_to,
        status,
        created_at,
        updated_at,
        reviewed_at,
        notes,
        requester:request_from (
          name,
          email,
          branch_id,
          branch:branch_id (
            location
          )
        ),
        recipient:request_to (
          name,
          email,
          branch_id,
          branch:branch_id (
            location
          )
        ),
        reviewer:reviewed_by (
          name
        ),
        items:product_requisition_items (
          id,
          quantity,
          product:product_id (
            id,
            product_name,
            price,
            category_id,
            category:category_id (
              category_name
            )
          )
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Transform the data
    const transformedData = data.map(request => ({
      ...request,
      requester_branch: request.requester?.branch?.location || "Unknown Branch",
      recipient_branch: request.recipient?.branch?.location || "Unknown Branch",
      reviewer_name: request.reviewer?.name || null,
      items: request.items.map(item => ({
        ...item,
        product_name: item.product?.product_name || "Unknown Product",
        price: item.product?.price || 0,
        category_name: item.product?.category?.category_name || "Unknown Category"
      }))
    }));

    res.json(transformedData);
  } catch (error) {
    console.error("Error fetching all requests:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET audit logs for admin (all users) - enhanced with view data
app.get("/api/audit-logs", async (req, res) => {
  try {
    const { page = 1, limit = 10, action, user_id, entity_type, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    // Use direct table query with joins instead of view
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        user:user_id (
          name,
          email,
          role:role_id (
            role_name
          ),
          branch:branch_id (
            location,
            address
          )
        )
      `)
      .order('timestamp', { ascending: false });

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (user_id) {
      query = query.eq('user_id', user_id);
    }
    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }
    if (start_date) {
      query = query.gte('timestamp', start_date);
    }
    if (end_date) {
      query = query.lte('timestamp', end_date);
    }

    // Get total count for pagination
    const { count } = await query.select('*', { count: 'exact', head: true });

    // Get paginated results
    const { data, error } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // Transform data to match expected format
    const transformedData = (data || []).map(log => ({
      ...log,
      user_name: log.user?.name || 'Unknown',
      user_email: log.user?.email || '',
      role_name: log.user?.role?.role_name || 'Unknown',
      branch_location: log.user?.branch?.location || 'Unknown',
      branch_address: log.user?.branch?.address || '',
      action_category: log.action === 'INSERT' ? 'Create' :
        log.action === 'UPDATE' ? 'Modify' :
          log.action === 'DELETE' ? 'Delete' :
            log.action?.includes('LOGIN') ? 'Authentication' :
              log.action?.includes('PRODUCT') ? 'Product Management' :
                log.action?.includes('REQUEST') ? 'Request Management' :
                  log.action?.includes('USER') ? 'User Management' :
                    log.action?.includes('BRANCH') ? 'Branch Management' :
                      log.action?.includes('CATEGORY') ? 'Category Management' : 'Other',
      severity_level: log.action?.includes('DELETE') || log.action?.includes('REMOVE') ? 'High' :
        log.action?.includes('UPDATE') || log.action?.includes('EDIT') ? 'Medium' :
          log.action?.includes('CREATE') || log.action?.includes('ADD') ? 'Low' :
            log.action?.includes('LOGIN') || log.action?.includes('VIEW') ? 'Info' : 'Medium',
      time_period: new Date(log.timestamp) > new Date(Date.now() - 60 * 60 * 1000) ? 'Just now' :
        new Date(log.timestamp) > new Date(Date.now() - 24 * 60 * 60 * 1000) ? 'Today' :
          new Date(log.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) ? 'This week' :
            new Date(log.timestamp) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) ? 'This month' : 'Older'
    }));

    res.json({
      logs: transformedData,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching audit logs overview:", error);
    res.status(500).json({ error: "Failed to fetch audit logs overview" });
  }
});


// GET audit logs for specific user
app.get("/api/audit-logs/user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10, action, entity_type, start_date, end_date } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        user:user_id (
          name,
          email,
          role:role_id (
            role_name
          ),
          branch:branch_id (
            location
          )
        )
      `)
      .eq('user_id', userId)
      .order('timestamp', { ascending: false });

    // Apply filters
    if (action) {
      query = query.eq('action', action);
    }
    if (entity_type) {
      query = query.eq('entity_type', entity_type);
    }
    if (start_date) {
      query = query.gte('timestamp', start_date);
    }
    if (end_date) {
      query = query.lte('timestamp', end_date);
    }

    // Get total count for pagination
    const { count } = await query.select('*', { count: 'exact', head: true });

    // Get paginated results
    const { data, error } = await query
      .range(offset, offset + limit - 1);

    if (error) throw error;

    res.json({
      logs: data || [],
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    });
  } catch (error) {
    console.error("Error fetching user audit logs:", error);
    res.status(500).json({ error: "Failed to fetch user audit logs" });
  }
});

// GET dashboard statistics
app.get("/api/dashboard/stats", rateLimits.dashboardStats, async (req, res) => {
  try {
    const { branch_id } = req.query;

    // Get total stock across all branches or specific branch
    let stockQuery = supabase
      .from("centralized_product")
      .select("quantity");

    if (branch_id) {
      stockQuery = stockQuery.eq("branch_id", branch_id);
    }

    const { data: stockData, error: stockError } = await stockQuery;
    if (stockError) throw stockError;

    const totalStock = stockData.reduce((sum, product) => sum + (product.quantity || 0), 0);

    // Get total products count
    let productsQuery = supabase
      .from("centralized_product")
      .select("id", { count: 'exact', head: true });

    if (branch_id) {
      productsQuery = productsQuery.eq("branch_id", branch_id);
    }

    const { count: totalProducts, error: productsError } = await productsQuery;
    if (productsError) throw productsError;

    // Get total categories count
    const { count: totalCategories, error: categoriesError } = await supabase
      .from("category")
      .select("*", { count: 'exact', head: true });
    if (categoriesError) throw categoriesError;

    // Get total branches count
    const { count: totalBranches, error: branchesError } = await supabase
      .from("branch")
      .select("*", { count: 'exact', head: true });
    if (branchesError) throw branchesError;

    // Get low stock products count
    let lowStockQuery = supabase
      .from("centralized_product")
      .select("id", { count: 'exact', head: true })
      .lt("quantity", 20)
      .gt("quantity", 0);

    if (branch_id) {
      lowStockQuery = lowStockQuery.eq("branch_id", branch_id);
    }

    const { count: lowStockCount, error: lowStockError } = await lowStockQuery;
    if (lowStockError) throw lowStockError;

    // Get out of stock products count
    let outOfStockQuery = supabase
      .from("centralized_product")
      .select("id", { count: 'exact', head: true })
      .eq("quantity", 0);

    if (branch_id) {
      outOfStockQuery = outOfStockQuery.eq("branch_id", branch_id);
    }

    const { count: outOfStockCount, error: outOfStockError } = await outOfStockQuery;
    if (outOfStockError) throw outOfStockError;

    // Get recent activity count (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { count: recentActivity, error: activityError } = await supabase
      .from("audit_logs")
      .select("*", { count: 'exact', head: true })
      .gte("timestamp", sevenDaysAgo.toISOString());
    if (activityError) throw activityError;

    res.json({
      totalStock,
      totalProducts: totalProducts || 0,
      totalCategories: totalCategories || 0,
      totalBranches: totalBranches || 0,
      lowStockCount: lowStockCount || 0,
      outOfStockCount: outOfStockCount || 0,
      recentActivity: recentActivity || 0,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error("Error fetching dashboard statistics:", error);
    res.status(500).json({ error: "Failed to fetch dashboard statistics" });
  }
});

// GET audit log statistics
app.get("/api/audit-logs/stats", rateLimits.auditLogs, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;

    let query = supabase
      .from("audit_logs")
      .select('action, timestamp, user_id');

    if (start_date) {
      query = query.gte('timestamp', start_date);
    }
    if (end_date) {
      query = query.lte('timestamp', end_date);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total_actions: data.length,
      actions_by_type: {},
      actions_by_user: {},
      recent_activity: data
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, 10)
    };

    data.forEach(log => {
      // Count by action type
      stats.actions_by_type[log.action] = (stats.actions_by_type[log.action] || 0) + 1;

      // Count by user
      stats.actions_by_user[log.user_id] = (stats.actions_by_user[log.user_id] || 0) + 1;
    });

    res.json(stats);
  } catch (error) {
    console.error("Error fetching audit log statistics:", error);
    res.status(500).json({ error: "Failed to fetch audit log statistics" });
  }
});

// Error handling middleware (must be last)
app.use(errorHandler);

// 404 handler moved to end of file

// Server startup moved to end of file

// Create New User (Legacy - keeping for backward compatibility)
app.post("/api/create_users", rateLimits.userCreation, validateRequest(schemas.user), async (req, res) => {
  const user = req.body;
  // Debug: log incoming user data
  console.log("Add User Request:", user);
  if (
    !user.email ||
    !user.password ||
    !user.role_id ||
    !user.contact ||
    !user.name
  ) {
    return res.status(400).json({
      error: "name, email, password, contact and role_id are required",
    });
  }

  // Clean contact number by removing non-numeric characters
  const cleanContact = user.contact.replace(/\D/g, "");

  // Validate contact number length
  if (cleanContact.length !== 11) {
    return res.status(400).json({
      error: "Contact number must be exactly 11 digits",
    });
  }

  // Hash the password using bcrypt
  const hashedPassword = await bcrypt.hash(user.password, 12);

  const insertPayload = {
    name: user.name,
    contact: cleanContact, // Use cleaned contact number
    email: user.email,
    password: hashedPassword,
    role_id: user.role_id, // already int
    branch_id: user.branch_id ? user.branch_id : null, // already int or null
    status: user.status || "Active",
  };
  console.log("Insert payload:", insertPayload);

  try {
    // First, check if the user already exists
    const { data: existingUser, error: checkError } = await supabase
      .from("user")
      .select("user_id")
      .eq("email", user.email)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      console.error("Error checking existing user:", checkError);
      return res.status(500).json({
        error: "Error checking for existing user",
        details: checkError,
      });
    }

    if (existingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Insert the new user
    const { data, error } = await supabase
      .from("user")
      .insert([insertPayload])
      .select();

    if (error) {
      console.error("Error inserting user:", error);
      return res.status(500).json({
        error: "Failed to create user",
        details: error,
        message: error.message,
        code: error.code,
        hint: error.hint,
      });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error in create_users:", error);
    res.status(500).json({
      error: "Failed to create user",
      details: error.message,
      stack: error.stack,
    });
  }
});

// Create Pending User (New flow using pending_user table)
app.post("/api/create_pending_user", rateLimits.userCreation, validateRequest(schemas.pendingUser), async (req, res) => {
  const user = req.body;
  console.log("Create Pending User Request:", user);

  if (!user.email || !user.role_id || !user.name) {
    return res.status(400).json({
      error: "name, email, and role_id are required",
    });
  }

  // Contact validation is now handled by the validation middleware
  const cleanContact = user.contact;

  try {
    // First, check if the user already exists in either table
    const { data: existingUser, error: checkError } = await supabase
      .from("user")
      .select("user_id")
      .eq("email", user.email)
      .single();

    const { data: existingPendingUser, error: checkPendingError } = await supabase
      .from("pending_user")
      .select("pending_user_id")
      .eq("email", user.email)
      .single();

    if ((checkError && checkError.code !== "PGRST116") || (checkPendingError && checkPendingError.code !== "PGRST116")) {
      console.error("Error checking existing user:", checkError || checkPendingError);
      return res.status(500).json({
        error: "Error checking for existing user",
        details: checkError || checkPendingError,
      });
    }

    if (existingUser || existingPendingUser) {
      return res
        .status(400)
        .json({ error: "User with this email already exists" });
    }

    // Generate a secure token for account setup
    const crypto = require('crypto');
    const setupToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Insert into pending_user table
    const insertPayload = {
      name: user.name,
      contact: cleanContact,
      email: user.email,
      role_id: user.role_id,
      branch_id: user.branch_id ? user.branch_id : null,
      status: "Pending",
      setup_token: setupToken,
      token_expiry: tokenExpiry.toISOString(),
    };

    console.log("Insert payload:", insertPayload);

    const { data, error } = await supabase
      .from("pending_user")
      .insert([insertPayload])
      .select();

    if (error) {
      console.error("Error inserting pending user:", error);
      return res.status(500).json({
        error: "Failed to create pending user",
        details: error,
      });
    }

    // Generate setup link - use the correct frontend port
    const setupLink = `${FRONTEND_URL}/setup-account?token=${setupToken}`;

    // Send email with setup link
    const emailResult = await sendSetupEmail(user.email, user.name, setupLink);

    if (emailResult.success) {
      console.log(`Setup email sent to ${user.email}`);
      console.log(`Email preview: ${emailResult.previewUrl}`);
    } else {
      console.error(`Failed to send email to ${user.email}:`, emailResult.error);
    }

    res.status(201).json({
      user: data[0],
      setupLink: setupLink,
      emailSent: emailResult.success,
      emailPreview: emailResult.previewUrl,
      message: "Pending user created successfully. Setup link generated and email sent."
    });

  } catch (error) {
    console.error("Error in create_pending_user:", error);
    res.status(500).json({
      error: "Failed to create pending user",
      details: error.message,
    });
  }
});

// Complete User Setup (Move from pending_user to user table)
app.post("/api/complete_user_setup", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      error: "Token and password are required",
    });
  }

  try {
    // Find pending user by setup token
    const { data: pendingUser, error: findError } = await supabase
      .from("pending_user")
      .select("*")
      .eq("setup_token", token)
      .single();

    if (findError || !pendingUser) {
      return res.status(400).json({
        error: "Invalid or expired setup token",
      });
    }

    // Check if token is expired
    if (new Date() > new Date(pendingUser.token_expiry)) {
      return res.status(400).json({
        error: "Setup token has expired",
      });
    }

    // Hash the password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Insert user into the main user table
    const userPayload = {
      email: pendingUser.email,
      password: hashedPassword,
      role_id: pendingUser.role_id,
      name: pendingUser.name,
      contact: pendingUser.contact,
      status: "Active",
      branch_id: pendingUser.branch_id,
    };

    const { data: newUser, error: insertError } = await supabase
      .from("user")
      .insert([userPayload])
      .select();

    if (insertError) {
      console.error("Error inserting user:", insertError);
      return res.status(500).json({
        error: "Failed to complete user setup",
        details: insertError,
      });
    }

    // Delete the pending user
    const { error: deleteError } = await supabase
      .from("pending_user")
      .delete()
      .eq("pending_user_id", pendingUser.pending_user_id);

    if (deleteError) {
      console.error("Error deleting pending user:", deleteError);
      // Don't fail the request, just log the error
    }

    // Log user setup completion
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([{
        user_id: newUser[0].user_id,
        action: "USER_SETUP_COMPLETED",
        description: `User ${newUser[0].name} (${newUser[0].email}) completed account setup`,
        entity_type: "user",
        entity_id: newUser[0].user_id,
        metadata: {
          role_id: newUser[0].role_id,
          branch_id: newUser[0].branch_id,
          setup_method: 'email_token'
        }
      }]);

    if (auditError) {
      console.error("Error logging user setup audit trail:", auditError);
    }

    res.json({
      message: "User setup completed successfully",
      user: newUser[0]
    });

  } catch (error) {
    console.error("Error in complete_user_setup:", error);
    res.status(500).json({
      error: "Failed to complete user setup",
      details: error.message,
    });
  }
});

// Get User by Setup Token (from pending_user table)
app.get("/api/user_by_token/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const { data: pendingUser, error } = await supabase
      .from("pending_user")
      .select(`
        pending_user_id,
        name,
        email,
        contact,
        role_id,
        branch_id,
        status,
        token_expiry,
        role:role_id (role_name),
        branch:branch_id (location)
      `)
      .eq("setup_token", token)
      .single();

    if (error || !pendingUser) {
      return res.status(404).json({
        error: "Invalid or expired setup token",
      });
    }

    // Check if token is expired
    if (new Date() > new Date(pendingUser.token_expiry)) {
      return res.status(400).json({
        error: "Setup token has expired",
      });
    }

    res.json(pendingUser);

  } catch (error) {
    console.error("Error fetching user by token:", error);
    res.status(500).json({
      error: "Failed to fetch user",
      details: error.message,
    });
  }
});

// Forgot Password - Send reset email
app.post("/api/forgot-password", rateLimits.passwordReset, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      error: "Email is required",
    });
  }

  try {
    // Check if user exists in the database
    const { data: user, error: userError } = await supabase
      .from("user")
      .select("user_id, name, email")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return res.status(404).json({
        error: "No account found with this email address",
      });
    }

    // Generate reset token
    const crypto = require('crypto');
    const resetToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + 1 * 60 * 60 * 1000); // 1 hour

    // Update user with reset token
    const { error: updateError } = await supabase
      .from("user")
      .update({
        setup_token: resetToken,
        token_expiry: tokenExpiry.toISOString(),
      })
      .eq("user_id", user.user_id);

    if (updateError) {
      console.error("Error updating user with reset token:", updateError);
      return res.status(500).json({
        error: "Failed to generate reset token",
        details: updateError,
      });
    }

    // Generate reset link
    const resetLink = `${FRONTEND_URL}/reset-password?token=${resetToken}`;

    // Send reset email
    const emailResult = await sendResetPasswordEmail(user.email, user.name, resetLink);

    if (emailResult.success) {
      console.log(`Reset password email sent to ${user.email}`);
      console.log(`Email preview: ${emailResult.previewUrl}`);
    } else {
      console.error(`Failed to send reset email to ${user.email}:`, emailResult.error);
    }

    res.json({
      message: "If an account with this email exists, a password reset link has been sent.",
      emailSent: emailResult.success,
      emailPreview: emailResult.previewUrl,
    });

  } catch (error) {
    console.error("Error in forgot-password:", error);
    res.status(500).json({
      error: "Failed to process password reset request",
      details: error.message,
    });
  }
});

// Reset Password - Update password with token
app.post("/api/reset-password", async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({
      error: "Token and password are required",
    });
  }

  try {
    // Find user by reset token
    const { data: user, error: findError } = await supabase
      .from("user")
      .select("user_id, email, token_expiry")
      .eq("setup_token", token)
      .single();

    if (findError || !user) {
      return res.status(400).json({
        error: "Invalid or expired reset token",
      });
    }

    // Check if token is expired
    if (new Date() > new Date(user.token_expiry)) {
      return res.status(400).json({
        error: "Reset token has expired",
      });
    }

    // Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(password, 12);

    // Update user password and clear reset token
    const { data, error: updateError } = await supabase
      .from("user")
      .update({
        password: hashedPassword,
        setup_token: null,
        token_expiry: null,
      })
      .eq("user_id", user.user_id)
      .select();

    if (updateError) {
      console.error("Error updating password:", updateError);
      return res.status(500).json({
        error: "Failed to reset password",
        details: updateError,
      });
    }

    // Log password reset
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([{
        user_id: user.user_id,
        action: "PASSWORD_RESET",
        description: `Password reset completed for user ${user.email}`,
        entity_type: "user",
        entity_id: user.user_id,
        metadata: {
          reset_method: 'email_token',
          email: user.email
        }
      }]);

    if (auditError) {
      console.error("Error logging password reset audit trail:", auditError);
    }

    res.json({
      message: "Password reset successfully",
      user: data[0]
    });

  } catch (error) {
    console.error("Error in reset-password:", error);
    res.status(500).json({
      error: "Failed to reset password",
      details: error.message,
    });
  }
});

// Get User by Reset Token
app.get("/api/user_by_reset_token/:token", async (req, res) => {
  const { token } = req.params;

  try {
    const { data: user, error } = await supabase
      .from("user")
      .select(`
        user_id,
        name,
        email,
        token_expiry
      `)
      .eq("setup_token", token)
      .single();

    if (error || !user) {
      return res.status(404).json({
        error: "Invalid or expired reset token",
      });
    }

    // Check if token is expired
    if (new Date() > new Date(user.token_expiry)) {
      return res.status(400).json({
        error: "Reset token has expired",
      });
    }

    res.json(user);

  } catch (error) {
    console.error("Error fetching user by reset token:", error);
    res.status(500).json({
      error: "Failed to fetch user",
      details: error.message,
    });
  }
});

// GET users
app.get("/api/get_users", async (req, res) => {
  const { data, error } = await supabase.from("user").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Update User
app.put("/api/users/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const user = req.body;
  const { data, error } = await supabase
    .from("user")
    .update({
      name: user.name,
      contact: user.contact,
      email: user.email,
      password: user.password,
      role_id: user.role_id, // already int
      branch_id: user.branch_id ? user.branch_id : null, // already int or null
      status: user.status,
    })
    .eq("user_id", user_id) // user_id is a UUID string, not a number
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0)
    return res.status(404).json({ error: "User not found" });
  res.json(data[0]);
});

// DELETE user
app.delete("/api/users/:user_id", async (req, res) => {
  const { user_id } = req.params;
  const { error } = await supabase
    .from("user")
    .delete()
    .eq("user_id", user_id); // user_id is a UUID string, not a number

  if (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
});

// POST add new branch to Supabase
app.post("/api/branches", async (req, res) => {
  const branch = req.body;

  // Debug: log incoming branch data
  console.log("Add Branch Request:", branch);
  console.log("Branch location:", branch.location);
  console.log("Branch address:", branch.address);

  if (!branch.location || !branch.address) {
    console.log("Validation failed - missing fields");
    return res.status(400).json({
      error: "location and address are required",
    });
  }

  const insertPayload = {
    location: branch.location,
    address: branch.address,
    latitude: branch.latitude || null,
    longitude: branch.longitude || null,
    map_snapshot_url: branch.map_snapshot_url || null,
  };

  console.log("Insert payload:", insertPayload);

  try {
    // First, check if the branch already exists
    const { data: existingBranch, error: checkError } = await supabase
      .from("branch")
      .select("id")
      .eq("location", branch.location)
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      // PGRST116 is "no rows returned" error
      console.error("Error checking existing branch:", checkError);
      return res.status(500).json({
        error: "Error checking for existing branch",
        details: checkError,
      });
    }

    if (existingBranch) {
      return res
        .status(400)
        .json({ error: "Branch with this name already exists" });
    }

    // Insert the new branch
    const { data, error } = await supabase
      .from("branch")
      .insert([insertPayload])
      .select("id, location, address");

    if (error) {
      console.error("Error inserting branch:", error);
      return res.status(500).json({
        error: "Failed to create branch",
        details: error,
        message: error.message,
        code: error.code,
        hint: error.hint,
      });
    }

    res.status(201).json(data[0]);
  } catch (error) {
    console.error("Error in create_branch:", error);
    res.status(500).json({
      error: "Failed to create branch",
      details: error.message,
      stack: error.stack,
    });
  }
});

// 404 handler (must be after all routes)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
