'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken, isAuthenticated } from '@/lib/auth';
import styles from './dashboard.module.css';
import Link from 'next/link';

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
        <div className={styles.navLeft}>
          <h1 className={styles.appName}>Inventory Management</h1>
          <div className={styles.navLinks}>
            <Link href="/dashboard" className={styles.navLink}>Dashboard</Link>
            <Link href="/inventory" className={styles.navLink}>Inventory</Link>
            <Link href="/merchants" className={styles.navLink}>Merchants</Link>
            <Link href="/reports" className={styles.navLink}>Reports</Link>
            <Link href="/users" className={styles.navLink}>Users</Link>
          </div>
        </div>
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
              <li><Link href="/inventory">Manage Inventory</Link></li>
              <li><Link href="/merchants">Manage Merchants</Link></li>
              <li><Link href="/users">Manage Users</Link></li>
              <li><Link href="/health">System Health</Link></li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
