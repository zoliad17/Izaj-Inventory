// SupabaseTest.tsx
import { useEffect, useState } from 'react';
import { testConnection } from './supabase';

export default function SupabaseTest() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const result = await testConnection();
      setConnected(result);
    }
    check();
  }, []);

  if (connected === null) return <div>Checking Supabase connection...</div>;
  if (connected === false) return <div>Connection failed. Check console.</div>;

  return <div>Connected to Supabase successfully!</div>;
}
