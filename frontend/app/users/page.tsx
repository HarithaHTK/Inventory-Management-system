'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getToken, removeToken, isAuthenticated } from '@/lib/auth';
import Link from 'next/link';
import styles from './users.module.css';

interface Role {
  alias: string;
  name: string;
  description?: string;
}

interface User {
  id: number;
  username: string;
  email: string;
  roleAlias: string | null;
  role?: Role;
  createdAt: string;
  updatedAt: string;
}

export default function UsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchUsers();
  }, [router]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = getToken();
      const response = await fetch('http://localhost:4000/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to fetch users');
        } else {
          throw new Error('Backend server is not responding. Please make sure the server is running.');
        }
      }

      const result = await response.json();
      setUsers(result.data || []);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Cannot connect to backend server. Please make sure it is running on http://localhost:4000');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to fetch users');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (userId: number, username: string) => {
    if (!confirm(`Are you sure you want to delete user "${username}"?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`http://localhost:4000/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete user');
        } else {
          throw new Error('Backend server is not responding');
        }
      }

      // Refresh the user list
      fetchUsers();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes('fetch')) {
        alert('Cannot connect to backend server. Please make sure it is running.');
      } else {
        alert(err instanceof Error ? err.message : 'Failed to delete user');
      }
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
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
        <button onClick={() => { removeToken(); router.push('/login'); }} className={styles.logoutBtn}>
          Logout
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <h2>User Management</h2>
          <Link href="/users/add" className={styles.addButton}>
            + Add New User
          </Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>ID</th>
                <th>Username</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.noData}>
                    No users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user.id}>
                    <td>{user.id}</td>
                    <td>{user.username}</td>
                    <td>{user.email}</td>
                    <td>
                      {user.role ? (
                        <span className={styles.roleBadge}>{user.role.name}</span>
                      ) : (
                        <span className={styles.noRole}>No role</span>
                      )}
                    </td>
                    <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td>
                      <div className={styles.actions}>
                        <Link 
                          href={`/users/edit/${user.id}`}
                          className={styles.editBtn}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(user.id, user.username)}
                          className={styles.deleteBtn}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}
