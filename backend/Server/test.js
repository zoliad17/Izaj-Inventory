const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors"); // Optional but helpful during development

const app = express();
const port = 5000;

// Enable CORS (optional, useful for frontend dev)
app.use(cors());

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// GET users route
app.get("/api/get_users", async (req, res) => {
  const { data, error } = await supabase.from("user").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Start server
app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}`);
});
