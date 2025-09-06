const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { supabase } = require("./supabase.node");
const { sendSetupEmail, sendResetPasswordEmail, sendRequestNotificationEmail, sendRequestStatusEmail } = require("./utils/emailService");

// Load environment variables from .env.local (in root directory)
require("dotenv").config({ path: '../../.env.local' });

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// GET all products from Supabase (filtered by branch_id)
app.get("/api/products", async (req, res) => {
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

// POST add new product to Supabase (with branch_id from request)
app.post("/api/products", async (req, res) => {
  const product = req.body;

  // Build a clean insert payload explicitly
  const insertPayload = {
    product_name: product.name,
    category_id: product.category,
    price: Number(product.price),
    quantity: Number(product.stock),
    status: product.status,
    branch_id: product.branch_id,
  };

  const { data, error } = await supabase
    .from("centralized_product")
    .insert([insertPayload])
    .select();

  if (error) {
    console.error("Error inserting product:", error);
    return res.status(500).json({ error: error.message });
  }

  // Log product creation (we need to get the user ID from the request)
  // For now, we'll log without user_id since this endpoint doesn't have authentication
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert([{
      user_id: "00000000-0000-0000-0000-000000000000", // Placeholder for system actions
      action: "PRODUCT_CREATED",
      description: `Product "${product.name}" created in branch ${product.branch_id}`,
      entity_type: "centralized_product",
      entity_id: data[0].id.toString(),
      metadata: {
        product_name: product.name,
        category_id: product.category,
        price: Number(product.price),
        quantity: Number(product.stock),
        status: product.status,
        branch_id: product.branch_id
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

// PUT update product in Supabase
app.put("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const product = req.body;
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

  // Log product update
  const { error: auditError } = await supabase
    .from("audit_logs")
    .insert([{
      user_id: "00000000-0000-0000-0000-000000000000", // Placeholder for system actions
      action: "PRODUCT_UPDATED",
      description: `Product "${product.name}" updated`,
      entity_type: "centralized_product",
      entity_id: id,
      metadata: {
        product_name: product.name,
        category_id: product.category,
        price: Number(product.price),
        quantity: Number(product.stock),
        status: product.status,
        branch_id: product.branch_id
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

// DELETE product from Supabase
app.delete("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from("centralized_product")
    .delete()
    .eq("id", parseInt(id, 10));
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// LOGIN endpoint for Express backend
app.post("/api/login", async (req, res) => {
  const { email, password } = req.body;

  console.log("Login attempt:", { email, password: "***" });

  // Hash the password for comparison
  const crypto = require('crypto');
  const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

  console.log("Hashed password:", hashedPassword);

  // First try with hashed password
  let { data, error } = await supabase
    .from("user")
    .select("*, role:role_id(role_name), branch_id")
    .eq("email", email)
    .eq("password", hashedPassword)
    .maybeSingle();

  console.log("Database response (hashed):", { data: data ? "User found" : "No user", error });

  // If no user found with hashed password, try with plain text password
  if (!data && !error) {
    console.log("Trying with plain text password...");
    const result = await supabase
      .from("user")
      .select("*, role:role_id(role_name), branch_id")
      .eq("email", email)
      .eq("password", password)
      .maybeSingle();

    data = result.data;
    error = result.error;
    console.log("Database response (plain text):", { data: data ? "User found" : "No user", error });
  }

  if (error) return res.status(500).json({ error: error.message });
  if (!data)
    return res.status(401).json({ error: "Invalid email or password" });
  if (!data.role || !data.role.role_name)
    return res.status(500).json({ error: "User role information is missing" });

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
});

// GET all users from Supabase (filtered by branch_id)
app.get("/api/users", async (req, res) => {
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

// Simple test endpoint to verify server is running
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// ==================== PRODUCT REQUEST ENDPOINTS ====================

// GET all branches for request dropdown
app.get("/api/branches", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("branch")
      .select("id, location, address")
      .order("location");

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error("Error fetching branches:", error);
    res.status(500).json({ error: error.message });
  }
});

// GET products from a specific branch (for requests)
app.get("/api/branches/:branchId/products", async (req, res) => {
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
app.post("/api/product-requests", async (req, res) => {
  try {
    const { requestFrom, requestTo, items, notes } = req.body;

    // Validate required fields
    if (!requestFrom || !requestTo || !items || items.length === 0) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    // Check and reserve inventory for each item
    const reservationResults = [];
    for (const item of items) {
      // Check current available quantity (total - reserved)
      const { data: productData, error: productError } = await supabase
        .from("centralized_product")
        .select("quantity, reserved_quantity")
        .eq("id", item.product_id)
        .single();

      if (productError) throw productError;
      if (!productData) {
        throw new Error(`Product with ID ${item.product_id} not found`);
      }

      const availableQuantity = productData.quantity - (productData.reserved_quantity || 0);

      if (availableQuantity < item.quantity) {
        return res.status(400).json({
          error: `Insufficient inventory for product ID ${item.product_id}. Available: ${availableQuantity}, Requested: ${item.quantity}`
        });
      }

      reservationResults.push({
        product_id: item.product_id,
        quantity: item.quantity,
        available_quantity: availableQuantity
      });
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

    // Reserve inventory by updating reserved_quantity
    for (const item of items) {
      // First get current reserved_quantity
      const { data: productData, error: fetchError } = await supabase
        .from("centralized_product")
        .select("reserved_quantity")
        .eq("id", item.product_id)
        .single();

      if (fetchError) {
        console.error("Error fetching product data:", fetchError);
        throw new Error("Failed to fetch product data");
      }

      const newReservedQuantity = (productData.reserved_quantity || 0) + item.quantity;

      const { error: reserveError } = await supabase
        .from("centralized_product")
        .update({
          reserved_quantity: newReservedQuantity
        })
        .eq("id", item.product_id);

      if (reserveError) {
        console.error("Error reserving inventory:", reserveError);
        // Rollback: remove reserved quantities for already processed items
        for (let i = 0; i < items.indexOf(item); i++) {
          const { data: rollbackData } = await supabase
            .from("centralized_product")
            .select("reserved_quantity")
            .eq("id", items[i].product_id)
            .single();

          if (rollbackData) {
            const rollbackReservedQuantity = Math.max(0, (rollbackData.reserved_quantity || 0) - items[i].quantity);
            await supabase
              .from("centralized_product")
              .update({
                reserved_quantity: rollbackReservedQuantity
              })
              .eq("id", items[i].product_id);
          }
        }
        throw new Error("Failed to reserve inventory");
      }
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
app.get("/api/product-requests/pending/:userId", async (req, res) => {
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
app.get("/api/product-requests/sent/:userId", async (req, res) => {
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
app.put("/api/product-requests/:requestId/review", async (req, res) => {
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
      // For approved requests: permanently deduct from inventory and remove reservation
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

        // Calculate new values
        const newQuantity = Math.max(0, productData.quantity - item.quantity);
        const newReservedQuantity = Math.max(0, (productData.reserved_quantity || 0) - item.quantity);

        // Update with calculated values
        const { error: updateError } = await supabase
          .from("centralized_product")
          .update({
            quantity: newQuantity,
            reserved_quantity: newReservedQuantity
          })
          .eq("id", item.product_id);

        if (updateError) {
          console.error("Error updating product quantity:", updateError);
          // Continue with other items even if one fails
        }
      }
    } else if (action === 'denied') {
      // For denied requests: restore reserved quantity back to available inventory
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

        // Calculate new values - restore reserved quantity to available
        const newQuantity = productData.quantity + item.quantity;
        const newReservedQuantity = Math.max(0, (productData.reserved_quantity || 0) - item.quantity);

        // Update with calculated values
        const { error: restoreError } = await supabase
          .from("centralized_product")
          .update({
            quantity: newQuantity,
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

    // Log audit trail
    const { error: auditError } = await supabase
      .from("audit_logs")
      .insert([{
        user_id: reviewedBy,
        action: action === 'approved' ? "PRODUCT_REQUEST_APPROVED" : "PRODUCT_REQUEST_DENIED",
        description: `Request #${requestId} ${action} by ${reviewerData?.name || 'Unknown'}`,
        entity_type: "product_requisition",
        entity_id: requestId,
        metadata: {
          original_requester: requestData.request_from,
          item_count: requestData.items.length,
          total_quantity: requestData.items.reduce((sum, item) => sum + item.quantity, 0),
          reviewer_notes: notes || null
        },
        old_values: {
          status: 'pending',
          reviewed_by: null,
          reviewed_at: null
        },
        new_values: {
          status: action,
          reviewed_by: reviewedBy,
          reviewed_at: new Date().toISOString(),
          notes: notes || null
        }
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

// GET audit logs for admin (all users)
app.get("/api/audit-logs", async (req, res) => {
  try {
    const { page = 1, limit = 10, action, user_id, entity_type, start_date, end_date } = req.query;
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
    console.error("Error fetching audit logs:", error);
    res.status(500).json({ error: "Failed to fetch audit logs" });
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

// GET audit log statistics
app.get("/api/audit-logs/stats", async (req, res) => {
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

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});

// Create New User (Legacy - keeping for backward compatibility)
app.post("/api/create_users", async (req, res) => {
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

  const insertPayload = {
    name: user.name,
    contact: cleanContact, // Use cleaned contact number
    email: user.email,
    password: user.password,
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
app.post("/api/create_pending_user", async (req, res) => {
  const user = req.body;
  console.log("Create Pending User Request:", user);

  if (!user.email || !user.role_id || !user.contact || !user.name) {
    return res.status(400).json({
      error: "name, email, contact and role_id are required",
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
    const frontendPort = process.env.FRONTEND_PORT || '5173'; // Default Vite port
    const setupLink = `http://localhost:${frontendPort}/setup-account?token=${setupToken}`;

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

    // Hash the password (in production, use bcrypt)
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

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
app.post("/api/forgot-password", async (req, res) => {
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
    const frontendPort = process.env.FRONTEND_PORT || '5173';
    const resetLink = `http://localhost:${frontendPort}/reset-password?token=${resetToken}`;

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

    // Hash the new password
    const crypto = require('crypto');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

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


