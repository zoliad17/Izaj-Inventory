// App.tsx or any component
import React, { useEffect, useState } from 'react';
import { testConnection } from './supabase';

export default function App() {
  const [connected, setConnected] = useState<boolean | null>(null);

  useEffect(() => {
    async function check() {
      const result = await testConnection();
      setConnected(result);
    }
    check();
  }, []);

  if (connected === null) return <div>Checking connection...</div>;
  if (connected === false) return <div>Connection failed. Check console for errors.</div>;

  return <div>Connected to Supabase successfully!</div>;
}
