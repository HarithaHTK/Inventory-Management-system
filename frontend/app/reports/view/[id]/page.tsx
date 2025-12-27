"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { getToken, isAuthenticated, removeToken } from "@/lib/auth";
import MerchantSelectionModal from "../../../components/MerchantSelectionModal";
import styles from "./view-report.module.css";

interface InventoryItem {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  price: number;
  sku?: string;
  category?: string;
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

export default function ViewReportPage() {
  const router = useRouter();
  const params = useParams();
  const reportId = params.id as string;
  
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showMerchantModal, setShowMerchantModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push("/login");
      return;
    }

    if (reportId) {
      fetchReport();
    }
  }, [router, reportId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();
      const response = await fetch(`${API_BASE}/reports/${reportId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to fetch report");
        }
        throw new Error("Failed to fetch report");
      }

      const result = await response.json();
      setReport(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch report");
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (!report) return 0;
    return report.inventoryItems.reduce(
      (sum, item) => {
        const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
        return sum + item.quantity * price;
      },
      0
    );
  };

  const handleSendEmail = () => {
    setShowMerchantModal(true);
  };

  const handleCloseModal = () => {
    setShowMerchantModal(false);
  };

  if (loading) {
    return (
      <div className={styles.container}>
        <div className={styles.loading}>Loading...</div>
      </div>
    );
  }

  if (error || !report) {
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
          <div className={styles.error}>{error || "Report not found"}</div>
          <Link href="/reports" className={styles.backLink}>
            ← Back to Reports
          </Link>
        </main>
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
            <h2>{report.title}</h2>
            {report.description && (
              <p className={styles.description}>{report.description}</p>
            )}
            <div className={styles.metadata}>
              <span>Created: {new Date(report.createdAt).toLocaleString()}</span>
              <span>•</span>
              <span>Last Updated: {new Date(report.updatedAt).toLocaleString()}</span>
            </div>
          </div>
          <button onClick={handleSendEmail} className={styles.emailBtn}>
            📧 Send Email
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.summaryCard}>
            <h3>Report Summary</h3>
            <div className={styles.summaryStats}>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Total Items</div>
                <div className={styles.statValue}>{report.inventoryItems.length}</div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Total Quantity</div>
                <div className={styles.statValue}>
                  {report.inventoryItems.reduce((sum, item) => sum + item.quantity, 0)}
                </div>
              </div>
              <div className={styles.stat}>
                <div className={styles.statLabel}>Total Value</div>
                <div className={styles.statValue}>${calculateTotal().toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className={styles.tableSection}>
            <h3>Inventory Items</h3>
            <div className={styles.tableContainer}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>SKU</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Value</th>
                  </tr>
                </thead>
                <tbody>
                  {report.inventoryItems.map((item, index) => (
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
                        <span className={styles.quantity}>{item.quantity}</span>
                      </td>
                      <td>${typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price).toFixed(2)}</td>
                      <td>
                        <strong>${(item.quantity * (typeof item.price === 'number' ? item.price : parseFloat(item.price))).toFixed(2)}</strong>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={6} className={styles.totalLabel}>
                      <strong>Grand Total</strong>
                    </td>
                    <td className={styles.totalValue}>
                      <strong>${calculateTotal().toFixed(2)}</strong>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      </main>

      {report && (
        <MerchantSelectionModal
          reportId={report.id}
          reportTitle={report.title}
          isOpen={showMerchantModal}
          onClose={handleCloseModal}
        />
      )}
    </div>
  );
}
