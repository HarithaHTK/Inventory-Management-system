"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, isAuthenticated, removeToken } from "@/lib/auth";
import styles from "../../merchants.module.css";

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

export default function EditMerchantPage() {
  const router = useRouter();
  const params = useParams();
  const merchantId = params.id as string;

  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    country: "",
    zipCode: "",
    businessLicense: "",
    isActive: true,
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchMerchant();
  }, [router, merchantId]);

  const fetchMerchant = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();
      const response = await fetch(`${API_BASE}/merchants/${merchantId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch merchant");
      }

      const result = await response.json();
      const merchantData = result.data;

      if (!merchantData) {
        throw new Error("Merchant not found");
      }

      setMerchant(merchantData);
      setFormData({
        name: merchantData.name,
        email: merchantData.email,
        phone: merchantData.phone,
        address: merchantData.address,
        city: merchantData.city || "",
        country: merchantData.country || "",
        zipCode: merchantData.zipCode || "",
        businessLicense: merchantData.businessLicense || "",
        isActive: merchantData.isActive,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch merchant");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData((prev) => ({ ...prev, [name]: checked }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (
      !formData.name.trim() ||
      !formData.email.trim() ||
      !formData.phone.trim() ||
      !formData.address.trim()
    ) {
      setError("Name, email, phone, and address are required");
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email.trim())) {
      setError("Please enter a valid email address");
      return;
    }

    // Basic phone validation
    const phoneDigits = formData.phone.replace(/\D/g, "");
    if (phoneDigits.length < 10) {
      setError("Phone number must contain at least 10 digits");
      return;
    }

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      city: formData.city.trim() || undefined,
      country: formData.country.trim() || undefined,
      zipCode: formData.zipCode.trim() || undefined,
      businessLicense: formData.businessLicense.trim() || undefined,
      isActive: formData.isActive,
    };

    try {
      setSubmitting(true);
      const token = getToken();
      const response = await fetch(`${API_BASE}/merchants/${merchantId}`, {
        method: "PATCH",
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
          throw new Error(errorData.message || "Failed to update merchant");
        }
        throw new Error("Backend server is not responding");
      }

      router.push("/merchants");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update merchant");
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

  if (!merchant) {
    return (
      <div className={styles.container}>
        <div className={styles.error}>Merchant not found</div>
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
        <div className={styles.formContainer}>
          <div className={styles.formHeader}>
            <div>
              <p className={styles.eyebrow}>Edit</p>
              <h2>Update Merchant</h2>
            </div>
            <Link href="/merchants" className={styles.backBtn}>
              Back to Merchants
            </Link>
          </div>

          {error && <div className={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="name">Merchant Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter merchant name"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="email">Email Address *</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="merchant@example.com"
                  required
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="phone">Phone Number *</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="(123) 456-7890"
                  required
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="address">Address *</label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder="Street address"
                required
                className={styles.input}
              />
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="city">City</label>
                <input
                  type="text"
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  placeholder="City name"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="country">Country</label>
                <input
                  type="text"
                  id="country"
                  name="country"
                  value={formData.country}
                  onChange={handleChange}
                  placeholder="Country name"
                  className={styles.input}
                />
              </div>

              <div className={styles.formGroup}>
                <label htmlFor="zipCode">Zip Code</label>
                <input
                  type="text"
                  id="zipCode"
                  name="zipCode"
                  value={formData.zipCode}
                  onChange={handleChange}
                  placeholder="12345"
                  className={styles.input}
                />
              </div>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="businessLicense">Business License</label>
              <input
                type="text"
                id="businessLicense"
                name="businessLicense"
                value={formData.businessLicense}
                onChange={handleChange}
                placeholder="License number"
                className={styles.input}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="isActive" className={styles.checkboxLabel}>
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleChange}
                  className={styles.checkbox}
                />
                <span>Active</span>
              </label>
            </div>

            <div className={styles.formActions}>
              <button
                type="submit"
                disabled={submitting}
                className={styles.submitBtn}
              >
                {submitting ? "Updating..." : "Update Merchant"}
              </button>
              <Link href="/merchants" className={styles.cancelBtn}>
                Cancel
              </Link>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
