"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, isAuthenticated, removeToken } from "@/lib/auth";
import styles from "./merchants.module.css";

interface Merchant {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  city?: string;
  country?: string;
  zipCode?: string;
  businessLicense?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function MerchantsPage() {
  const router = useRouter();
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchMerchants();
  }, [router]);

  const fetchMerchants = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();
      const response = await fetch(`${API_BASE}/merchants`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch merchants");
        }
        throw new Error(
          "Backend server is not responding. Please make sure the server is running."
        );
      }

      const result = await response.json();
      setMerchants(result.data || []);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Cannot connect to backend server. Please make sure it is running on http://localhost:4000"
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch merchants");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (merchantId: number, name: string) => {
    if (!confirm(`Delete "${name}" from merchants?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/merchants/${merchantId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete merchant");
        }
        throw new Error("Backend server is not responding");
      }

      fetchMerchants();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        alert("Cannot connect to backend server. Please make sure it is running.");
      } else {
        alert(err instanceof Error ? err.message : "Failed to delete merchant");
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
            <Link href="/dashboard" className={styles.navLink}>
              Dashboard
            </Link>
            <Link href="/inventory" className={styles.navLink}>
              Inventory
            </Link>
            <Link href="/merchants" className={styles.navLink}>
              Merchants
            </Link>
            <Link href="/users" className={styles.navLink}>
              Users
            </Link>
          </div>
        </div>
        <button
          onClick={() => {
            removeToken();
            router.push("/login");
          }}
          className={styles.logoutBtn}
        >
          Logout
        </button>
      </nav>

      <main className={styles.main}>
        <div className={styles.header}>
          <div>
            <p className={styles.eyebrow}>Management</p>
            <h2>Merchants</h2>
          </div>
          <Link href="/merchants/add" className={styles.addButton}>
            + Add Merchant
          </Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Phone</th>
                <th>City</th>
                <th>Country</th>
                <th>Status</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {merchants.length === 0 ? (
                <tr>
                  <td colSpan={9} className={styles.noData}>
                    No merchants yet
                  </td>
                </tr>
              ) : (
                merchants.map((merchant, index) => (
                  <tr key={merchant.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles.merchantCell}>
                        <span className={styles.merchantName}>{merchant.name}</span>
                        {merchant.address && (
                          <span className={styles.merchantAddress}>
                            {merchant.address}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <a href={`mailto:${merchant.email}`} className={styles.emailLink}>
                        {merchant.email}
                      </a>
                    </td>
                    <td>
                      <a href={`tel:${merchant.phone}`} className={styles.phoneLink}>
                        {merchant.phone}
                      </a>
                    </td>
                    <td>{merchant.city || "-"}</td>
                    <td>{merchant.country || "-"}</td>
                    <td>
                      <span
                        className={
                          merchant.isActive
                            ? styles.statusActive
                            : styles.statusInactive
                        }
                      >
                        {merchant.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      {new Date(merchant.updatedAt || merchant.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/merchants/edit/${merchant.id}`}
                          className={styles.editBtn}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(merchant.id, merchant.name)}
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
