import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://phhbjvlrwrtiokfbjorb.supabase.co';  // Replace with your project URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBoaGJqdmxyd3J0aW9rZmJqb3JiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDI5MTg4MjIsImV4cCI6MjA1ODQ5NDgyMn0.6xja3RGLYxT5ZjepH-wnucvA3GBHNolD_jtFXiWzf4Y';  // Replace with your anon key

const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function testConnection() {
  const { data, error } = await supabase.from('users').select('*').limit(1);

  if (error) {
    console.error('Supabase connection error:', error);
    return false;
  }

  console.log('Supabase connection successful! Sample data:', data);
  return true;
}

testConnection();

export default supabase;
