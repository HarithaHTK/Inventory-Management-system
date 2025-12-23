import { redirect } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';

export default function Home() {
  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    redirect('/login');
  }

  return (
    <main style={{ padding: '2rem', fontFamily: 'system-ui, sans-serif' }}>
      <h1>Welcome to Inventory Management System</h1>
      <p>You are logged in!</p>
    </main>
  );
}
