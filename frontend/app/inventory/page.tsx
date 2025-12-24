"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, isAuthenticated, removeToken } from "@/lib/auth";
import styles from "./inventory.module.css";

interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  sku?: string;
  category?: string;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function InventoryPage() {
  const router = useRouter();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchInventory();
  }, [router]);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();
      const response = await fetch(`${API_BASE}/inventory`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch inventory");
        }
        throw new Error(
          "Backend server is not responding. Please make sure the server is running."
        );
      }

      const result = await response.json();
      setItems(result.data || []);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Cannot connect to backend server. Please make sure it is running on http://localhost:4000"
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch inventory");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (itemId: number, name: string) => {
    if (!confirm(`Delete "${name}" from inventory?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/inventory/${itemId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete item");
        }
        throw new Error("Backend server is not responding");
      }

      fetchInventory();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        alert("Cannot connect to backend server. Please make sure it is running.");
      } else {
        alert(err instanceof Error ? err.message : "Failed to delete item");
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
            <p className={styles.eyebrow}>Operations</p>
            <h2>Inventory</h2>
          </div>
          <Link href="/inventory/add" className={styles.addButton}>
            + Add Item
          </Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>SKU</th>
                <th>Category</th>
                <th>Qty</th>
                <th>Price</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td colSpan={8} className={styles.noData}>
                    No inventory items yet
                  </td>
                </tr>
              ) : (
                items.map((item, index) => (
                  <tr key={item.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles.itemCell}>
                        <span className={styles.itemName}>{item.name}</span>
                        {item.description && (
                          <span className={styles.itemDescription}>
                            {item.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      {item.sku ? (
                        <span className={styles.skuBadge}>{item.sku}</span>
                      ) : (
                        <span className={styles.noSku}>-</span>
                      )}
                    </td>
                    <td>
                      {item.category ? (
                        <span className={styles.categoryBadge}>{item.category}</span>
                      ) : (
                        <span className={styles.noSku}>Uncategorized</span>
                      )}
                    </td>
                    <td>
                      <span
                        className={
                          item.quantity <= 5
                            ? styles.lowStock
                            : styles.stock
                        }
                      >
                        {item.quantity}
                      </span>
                    </td>
                    <td>
                      {typeof item.price === "number"
                        ? `$${item.price.toFixed(2)}`
                        : "-"}
                    </td>
                    <td>
                      {new Date(item.updatedAt || item.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/inventory/edit/${item.id}`}
                          className={styles.editBtn}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item.id, item.name)}
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
