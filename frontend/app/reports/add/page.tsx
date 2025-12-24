"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, isAuthenticated, removeToken } from "@/lib/auth";
import styles from "./add-report.module.css";

interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  sku?: string;
  category?: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function AddReportPage() {
  const router = useRouter();
  const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
  const [selectedItems, setSelectedItems] = useState<Set<number>>(new Set());
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
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
        throw new Error("Failed to fetch inventory");
      }

      const result = await response.json();
      setInventoryItems(result.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch inventory");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleItem = (itemId: number) => {
    const newSelected = new Set(selectedItems);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItems(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedItems.size === inventoryItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(inventoryItems.map(item => item.id)));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    if (selectedItems.size === 0) {
      setError("Please select at least one inventory item");
      return;
    }

    try {
      setSubmitting(true);
      setError("");

      const token = getToken();
      const response = await fetch(`${API_BASE}/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description: description || undefined,
          inventoryItemIds: Array.from(selectedItems),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create report");
      }

      router.push("/reports");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create report");
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
            <Link href="/reports" className={styles.navLink}>
              Reports
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
            <Link href="/reports" className={styles.backLink}>
              ← Back to Reports
            </Link>
            <h2>Create New Report</h2>
          </div>
        </div>

        <form onSubmit={handleSubmit} className={styles.form}>
          {error && <div className={styles.error}>{error}</div>}

          <div className={styles.formSection}>
            <h3>Report Details</h3>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter report title"
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter report description (optional)"
                rows={3}
              />
            </div>
          </div>

          <div className={styles.formSection}>
            <div className={styles.sectionHeader}>
              <h3>Select Inventory Items ({selectedItems.size} selected)</h3>
              <button
                type="button"
                onClick={handleSelectAll}
                className={styles.selectAllBtn}
              >
                {selectedItems.size === inventoryItems.length
                  ? "Deselect All"
                  : "Select All"}
              </button>
            </div>

            {inventoryItems.length === 0 ? (
              <div className={styles.noItems}>
                No inventory items available. Please add items first.
              </div>
            ) : (
              <div className={styles.itemsList}>
                {inventoryItems.map((item) => (
                  <div key={item.id} className={styles.itemCard}>
                    <input
                      type="checkbox"
                      id={`item-${item.id}`}
                      checked={selectedItems.has(item.id)}
                      onChange={() => handleToggleItem(item.id)}
                      className={styles.checkbox}
                    />
                    <label htmlFor={`item-${item.id}`} className={styles.itemLabel}>
                      <div className={styles.itemInfo}>
                        <div className={styles.itemName}>{item.name}</div>
                        {item.description && (
                          <div className={styles.itemDescription}>
                            {item.description}
                          </div>
                        )}
                        <div className={styles.itemMeta}>
                          {item.sku && (
                            <span className={styles.sku}>{item.sku}</span>
                          )}
                          <span className={styles.quantity}>
                            Qty: {item.quantity}
                          </span>
                          <span className={styles.price}>
                            ${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}
                          </span>
                        </div>
                      </div>
                    </label>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={styles.formActions}>
            <Link href="/reports" className={styles.cancelBtn}>
              Cancel
            </Link>
            <button
              type="submit"
              className={styles.submitBtn}
              disabled={submitting || selectedItems.size === 0}
            >
              {submitting ? "Generating..." : "Generate Report"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
