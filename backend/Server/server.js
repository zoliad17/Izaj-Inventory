const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { supabase } = require("./supabase.node");

// Example: Use dotenv for environment variables (optional)
require("dotenv").config();

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
  const { data, error } = await supabase
    .from("user")
    .select("*, role:role_id(role_name), branch_id")
    .eq("email", email)
    .eq("password", password)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data)
    return res.status(401).json({ error: "Invalid email or password" });
  if (!data.role || !data.role.role_name)
    return res.status(500).json({ error: "User role information is missing" });
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

// Create New User
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
    .eq("user_id", Number(user_id))
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
    .eq("user_id", Number(user_id));

  if (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ error: error.message });
  }
  res.status(204).send();
});
