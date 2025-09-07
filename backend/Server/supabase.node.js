// backend/Server/supabase.node.js
const { createClient } = require("@supabase/supabase-js");
const { config } = require("dotenv");
config({ path: "../../.env.local" });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

module.exports = { supabase };
