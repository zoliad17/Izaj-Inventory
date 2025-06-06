import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://phhbjvlrwrtiokfbjorb.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaGJqdmxyd3J0aW9rZmJqb3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MTg4MjIsImV4cCI6MjA1ODQ5NDgyMn0.6xja3RGLYxT5ZjepH-wnucvA3GBHNolD_jtFXiWzf4Y";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testFetchBranches() {
  const { data, error } = await supabase.from("branch").select("id, location");
  if (error) {
    console.error("Error fetching branches:", error);
  } else {
    console.log("Branches data:", data);
  }
}

testFetchBranches();
