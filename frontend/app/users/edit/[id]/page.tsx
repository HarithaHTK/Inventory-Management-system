'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getToken, removeToken, isAuthenticated } from '@/lib/auth';
import Link from 'next/link';
import styles from '../../users.module.css';

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
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;

  const [roles, setRoles] = useState<Role[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');
  
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    roleAlias: '',
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    fetchData();
  }, [router, userId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = getToken();

      // Fetch user data
      const userResponse = await fetch(`http://localhost:4000/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user');
      }

      const userResult = await userResponse.json();
      const userData = userResult.data;

      setUser(userData);
      setFormData({
        username: userData.username || '',
        email: userData.email || '',
        roleAlias: userData.roleAlias || '',
      });

      // Fetch roles
      const rolesResponse = await fetch('http://localhost:4000/roles', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!rolesResponse.ok) {
        throw new Error('Failed to fetch roles');
      }

      const rolesData = await rolesResponse.json();
      setRoles(rolesData || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.email) {
      setError('Please fill in all required fields');
      return;
    }

    try {
      setSubmitting(true);
      const token = getToken();
      
      const response = await fetch(`http://localhost:4000/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          roleAlias: formData.roleAlias || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update user');
      }

      // Redirect to users list
      router.push('/users');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>User not found</div>
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
            <Link href="/users" className={styles.navLink}>Users</Link>
          </div>
        </div>
        <button onClick={() => { removeToken(); router.push('/login'); }} className={styles.logoutBtn}>
          Logout
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <h2>Edit User</h2>
            <Link href="/users" className={styles.backBtn}>
              ← Back to Users
            </Link>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="username">Username *</label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="email">Email *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="roleAlias">Role</label>
              <select
                id="roleAlias"
                name="roleAlias"
                value={formData.roleAlias}
                onChange={handleChange}
                className={styles.select}
              >
                <option value="">No role</option>
                {roles.map((role) => (
                  <option key={role.alias} value={role.alias}>
                    {role.name}
                  </option>
                ))}
              </select>
              <small className={styles.helpText}>
                Select a role to assign permissions to this user
              </small>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? 'Updating...' : 'Update User'}
              </button>
              <Link href="/users" className={styles.cancelBtn}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
