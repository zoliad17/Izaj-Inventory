const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { supabase } = require('./Supabase/supabase.node');

// Example: Use dotenv for environment variables (optional)
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// GET all products from Supabase (filtered by branch_id)
app.get('/api/products', async (req, res) => {
  const branchId = req.query.branch_id;
  if (!branchId) {
    return res.status(400).json({ error: 'branch_id is required' });
  }
  // Join lucena_product with category to get category name
  const { data, error } = await supabase
    .from('lucena_product')
    .select('*, category:category_id(category_name)')
    .eq('branch_id', branchId);
  if (error) return res.status(500).json({ error: error.message });
  // Map category name to top-level for frontend
  const mapped = data.map((product) => ({
    ...product,
    category: product.category?.category_name || '',
  }));
  res.json(mapped);
});

// POST add new product to Supabase (with branch_id from request)
app.post('/api/products', async (req, res) => {
  const product = req.body;
  // Debug: log incoming product data
  console.log('Add Product Request:', product);
  // Require branchId in the request body
  if (!product.branch_id) {
    return res.status(400).json({ error: 'branch_id is required' });
  }
  const insertPayload = {
    product_name: product.name,
    category_id: product.category, // store as id
    price: Number(product.price),
    quantity: Number(product.stock),
    status: product.status,
    branch_id: product.branch_id,
  };
  console.log('Insert payload:', insertPayload);
  const { data, error } = await supabase
    .from('lucena_product')
    .insert([insertPayload])
    .select();
  if (error) {
    // Debug: log error details
    console.error('Error inserting product:', error);
    return res.status(500).json({ error: error.message, details: error });
  }
  res.status(201).json(data[0]);
});

// PUT update product in Supabase
app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const product = req.body;
  const { data, error } = await supabase
    .from('lucena_product')
    .update({
      product_name: product.name,
      category_id: product.category, // use category_id
      price: Number(product.price),
      quantity: Number(product.stock),
      status: product.status,
      branch_id: product.branch_id, // ensure branch_id is updated if needed
      // Add other fields as needed
    })
    .eq('id', id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  if (!data || data.length === 0) return res.status(404).json({ error: 'Product not found' });
  res.json(data[0]);
});

// DELETE product from Supabase
app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { error } = await supabase
    .from('lucena_product')
    .delete()
    .eq('id', id);
  if (error) return res.status(500).json({ error: error.message });
  res.status(204).send();
});

// LOGIN endpoint for Express backend
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;
  const { data, error } = await supabase
    .from('user')
    .select('*, role:role_id(role_name), branch_id')
    .eq('email', email)
    .eq('password', password)
    .maybeSingle();
  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(401).json({ error: 'Invalid email or password' });
  if (!data.role || !data.role.role_name) return res.status(500).json({ error: 'User role information is missing' });
  res.json({
    user: data,
    role: data.role.role_name,
    branchId: data.branch_id || null,
  });
});

// GET all users from Supabase (filtered by branch_id)
app.get('/api/users', async (req, res) => {
  const branchId = req.query.branch_id;
  if (!branchId) {
    return res.status(400).json({ error: 'branch_id is required' });
  }
  const { data, error } = await supabase
    .from('user')
    .select('*, role:role_id(role_name)')
    .eq('branch_id', branchId);
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// GET all categories from Supabase
app.get('/api/categories', async (req, res) => {
  const { data, error } = await supabase
    .from('category')
    .select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Simple test endpoint to verify server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working!' });
});

app.listen(PORT, () => {
  console.log(`Express server running on http://localhost:${PORT}`);
});
