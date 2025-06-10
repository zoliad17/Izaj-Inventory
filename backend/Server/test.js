const express = require("express");
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors"); // Optional but helpful during development

const app = express();
const port = 5000;

// Enable CORS (optional, useful for frontend dev)
app.use(cors());

// Initialize Supabase client
const supabase = createClient(
  "https://phhbjvlrwrtiokfbjorb.supabase.co", // 🔁 Replace this with your actual Supabase URL
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaGJqdmxyd3J0aW9rZmJqb3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MTg4MjIsImV4cCI6MjA1ODQ5NDgyMn0.6xja3RGLYxT5ZjepH-wnucvA3GBHNolD_jtFXiWzf4Y" // 🔁 Replace this with your actual Supabase key
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
