"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, isAuthenticated, removeToken } from "@/lib/auth";
import styles from "../inventory.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function AddInventoryPage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    quantity: "",
    price: "",
    sku: "",
    category: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
    }
  }, [router]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const quantity = Number(formData.quantity);
    const price = Number(formData.price);

    if (!formData.name.trim() || !formData.description.trim()) {
      setError("Name and description are required");
      return;
    }

    if (Number.isNaN(quantity) || quantity < 0) {
      setError("Quantity must be zero or greater");
      return;
    }

    if (Number.isNaN(price) || price < 0) {
      setError("Price must be zero or greater");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim(),
      quantity,
      price,
      sku: formData.sku.trim() || undefined,
      category: formData.category.trim() || undefined,
    };

    try {
      setSubmitting(true);
      const token = getToken();
      const response = await fetch(`${API_BASE}/inventory`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to create item");
        }
        throw new Error("Backend server is not responding");
      }

      router.push("/inventory");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create item");
    } finally {
      setSubmitting(false);
    }
  };

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
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <div>
              <p className={styles.eyebrow}>Create</p>
              <h2>Add Inventory Item</h2>
            </div>
            <Link href="/inventory" className={styles.backBtn}>
              Back to Inventory
            </Link>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Description *</label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={3}
                className={styles.textarea}
              />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="quantity">Quantity *</label>
                <input
                  type="number"
                  id="quantity"
                  name="quantity"
                  min={0}
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="price">Price *</label>
                <input
                  type="number"
                  id="price"
                  name="price"
                  min={0}
                  step="0.01"
                  value={formData.price}
                  onChange={handleChange}
                  required
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label htmlFor="sku">SKU</label>
                <input
                  type="text"
                  id="sku"
                  name="sku"
                  value={formData.sku}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="Optional stock keeping unit"
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="category">Category</label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className={styles.input}
                  placeholder="e.g. Electronics"
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? "Saving..." : "Save Item"}
              </button>
              <Link href="/inventory" className={styles.cancelBtn}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
