'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken, isAuthenticated } from '@/lib/auth';
import styles from './dashboard.module.css';

interface User {
  userId: number;
  username: string;
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    // In a real app, you would fetch user data here
    setLoading(false);
  }, [router]);

  const handleLogout = () => {
    removeToken();
    router.push('/login');
  };

  if (loading) {
    return <div className={styles.container}>Loading...</div>;
  }

  return (
    <div className={styles.container}>
      <nav className={styles.navbar}>
        <h1 className={styles.appName}>Inventory Management</h1>
        <button onClick={handleLogout} className={styles.logoutBtn}>
          Logout
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.card}>
          <h2>Welcome!</h2>
          <p>You are successfully logged in to the Inventory Management System.</p>
          
          <div className={styles.quickLinks}>
            <h3>Quick Links</h3>
            <ul>
              <li><a href="/users">View All Users</a></li>
              <li><a href="/health">System Health</a></li>
              <li><a href="/profile">My Profile</a></li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
