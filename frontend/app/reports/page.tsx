"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getToken, isAuthenticated, removeToken } from "@/lib/auth";
import styles from "./reports.module.css";

interface InventoryItem {
  id: number;
  name: string;
  quantity: number;
  price: number;
}

interface Report {
  id: number;
  title: string;
  description?: string;
  inventoryItems: InventoryItem[];
  createdAt: string;
  updatedAt: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

export default function ReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    fetchReports();
  }, [router]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();
      const response = await fetch(`${API_BASE}/reports`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch reports");
        }
        throw new Error(
          "Backend server is not responding. Please make sure the server is running."
        );
      }

      const result = await response.json();
      setReports(result || []);
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        setError(
          "Cannot connect to backend server. Please make sure it is running on http://localhost:4000"
        );
      } else {
        setError(err instanceof Error ? err.message : "Failed to fetch reports");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (reportId: number, title: string) => {
    if (!confirm(`Delete report "${title}"?`)) {
      return;
    }

    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/reports/${reportId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to delete report");
        }
        throw new Error("Backend server is not responding");
      }

      fetchReports();
    } catch (err) {
      if (err instanceof TypeError && err.message.includes("fetch")) {
        alert("Cannot connect to backend server. Please make sure it is running.");
      } else {
        alert(err instanceof Error ? err.message : "Failed to delete report");
      }
    }
  };

  const handleSendToMerchants = (reportId: number, title: string) => {
    // Dummy function for now
    alert(`Send to Merchants feature for "${title}" - Coming Soon!`);
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
            <p className={styles.eyebrow}>Analytics</p>
            <h2>Reports</h2>
          </div>
          <Link href="/reports/add" className={styles.addButton}>
            + Create Report
          </Link>
        </div>

        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.tableContainer}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Title</th>
                <th>Description</th>
                <th>Items</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.length === 0 ? (
                <tr>
                  <td colSpan={6} className={styles.noData}>
                    No reports yet. Create your first report!
                  </td>
                </tr>
              ) : (
                reports.map((report, index) => (
                  <tr key={report.id}>
                    <td>{index + 1}</td>
                    <td>
                      <div className={styles.reportCell}>
                        <span className={styles.reportTitle}>{report.title}</span>
                      </div>
                    </td>
                    <td>
                      {report.description ? (
                        <span className={styles.description}>{report.description}</span>
                      ) : (
                        <span className={styles.noDescription}>-</span>
                      )}
                    </td>
                    <td>
                      <span className={styles.itemCount}>
                        {report.inventoryItems?.length || 0} items
                      </span>
                    </td>
                    <td>
                      {new Date(report.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <div className={styles.actions}>
                        <Link
                          href={`/reports/view/${report.id}`}
                          className={styles.viewBtn}
                        >
                          View
                        </Link>
                        <button
                          onClick={() => handleSendToMerchants(report.id, report.title)}
                          className={styles.sendBtn}
                        >
                          Send
                        </button>
                        <button
                          onClick={() => handleDelete(report.id, report.title)}
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
