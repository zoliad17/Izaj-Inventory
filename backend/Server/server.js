const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { supabase } = require("./supabase.node");
const { sendSetupEmail, sendResetPasswordEmail } = require("./utils/emailService");

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

  console.log("Insert payload:", insertPayload);

  const { data, error } = await supabase
    .from("centralized_product")
    .insert([insertPayload])
    .select();

  if (error) {
    console.error("Error inserting product:", error);
    return res.status(500).json({ error: error.message });
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

  console.log("Login successful for:", data.name);

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


