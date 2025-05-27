import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phhbjvlrwrtiokfbjorb.supabase.co';  // Replace with your Supabase URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaGJqdmxyd3J0aW9rZmJqb3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MTg4MjIsImV4cCI6MjA1ODQ5NDgyMn0.6xja3RGLYxT5ZjepH-wnucvA3GBHNolD_jtFXiWzf4Y';              // Replace with your anon/public key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  const { data, error } = await supabase;

  if (error) {
    console.error('Supabase connection error:', error);
    return false;
  }

  console.log('Supabase connection successful!');
  return true;
}

testConnection();

