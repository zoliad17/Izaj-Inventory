import { useEffect, useState } from 'react';
import supabase from './supabase';

export default function UsersData() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const { data, error } = await supabase.from('users').select('*');

      if (error) {
        console.error('Error fetching data:', error);
        setError(error.message);
      } else if (data && data.length > 0) {
        setUser(data || []);
      } else {
        setError('No user found');
      }
      setLoading(false);
    }

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      <h2>User Data</h2>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </div>
  );
}
