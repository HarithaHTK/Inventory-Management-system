"use client";

import { useState, useEffect } from "react";
import { getToken } from "@/lib/auth";
import styles from "./MerchantSelectionModal.module.css";

interface Merchant {
  id: number;
  name: string;
  email: string;
  phone: string;
  isActive: boolean;
}

interface MerchantSelectionModalProps {
  reportId: number;
  reportTitle: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function MerchantSelectionModal({
  reportId,
  reportTitle,
  isOpen,
  onClose,
}: MerchantSelectionModalProps) {
  const [merchants, setMerchants] = useState<Merchant[]>([]);
  const [selectedMerchants, setSelectedMerchants] = useState<Set<number>>(
    new Set()
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectAll, setSelectAll] = useState(false);

  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:4000";

  useEffect(() => {
    if (isOpen) {
      fetchActiveMerchants();
    }
  }, [isOpen]);

  const fetchActiveMerchants = async () => {
    try {
      setLoading(true);
      setError("");
      const token = getToken();

      const response = await fetch(`${API_BASE}/merchants/active/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch merchants");
      }

      const result = await response.json();
      setMerchants(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch merchants");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectMerchant = (merchantId: number) => {
    const newSelected = new Set(selectedMerchants);
    if (newSelected.has(merchantId)) {
      newSelected.delete(merchantId);
    } else {
      newSelected.add(merchantId);
    }
    setSelectedMerchants(newSelected);

    // Update selectAll checkbox state
    setSelectAll(newSelected.size === merchants.length && merchants.length > 0);
  };

  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedMerchants(new Set());
      setSelectAll(false);
    } else {
      const allIds = new Set(merchants.map((m) => m.id));
      setSelectedMerchants(allIds);
      setSelectAll(true);
    }
  };

  const handleSendEmail = () => {
    if (selectedMerchants.size === 0) {
      alert("Please select at least one merchant");
      return;
    }

    const selectedMerchantNames = merchants
      .filter((m) => selectedMerchants.has(m.id))
      .map((m) => m.name)
      .join(", ");

    console.log("Sending report to merchants:", {
      reportId,
      reportTitle,
      selectedMerchantIds: Array.from(selectedMerchants),
      selectedMerchantCount: selectedMerchants.size,
    });

    // TODO: Implement send email functionality
    alert(
      `Ready to send "${reportTitle}" to ${selectedMerchants.size} merchant(s):\n${selectedMerchantNames}`
    );
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Select Merchants</h2>
          <button className={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        <div className={styles.content}>
          <p className={styles.reportInfo}>
            Sending report: <strong>{reportTitle}</strong>
          </p>

          {error && <div className={styles.error}>{error}</div>}

          {loading ? (
            <div className={styles.loading}>Loading merchants...</div>
          ) : merchants.length === 0 ? (
            <div className={styles.noMerchants}>
              No active merchants available
            </div>
          ) : (
            <>
              <div className={styles.selectAllContainer}>
                <label className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className={styles.checkbox}
                  />
                  <span>Select All Merchants ({merchants.length})</span>
                </label>
              </div>

              <div className={styles.merchantsList}>
                {merchants.map((merchant) => (
                  <div key={merchant.id} className={styles.merchantItem}>
                    <label className={styles.checkboxLabel}>
                      <input
                        type="checkbox"
                        checked={selectedMerchants.has(merchant.id)}
                        onChange={() => handleSelectMerchant(merchant.id)}
                        className={styles.checkbox}
                      />
                      <div className={styles.merchantInfo}>
                        <span className={styles.merchantName}>
                          {merchant.name}
                        </span>
                        <span className={styles.merchantEmail}>
                          {merchant.email}
                        </span>
                      </div>
                    </label>
                  </div>
                ))}
              </div>

              <div className={styles.selectedCount}>
                {selectedMerchants.size} of {merchants.length} merchant
                {merchants.length !== 1 ? "s" : ""} selected
              </div>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onClose}>
            Cancel
          </button>
          <button
            className={styles.sendBtn}
            onClick={handleSendEmail}
            disabled={selectedMerchants.size === 0 || loading}
          >
            📧 Send Email
          </button>
        </div>
      </div>
    </div>
  );
}
