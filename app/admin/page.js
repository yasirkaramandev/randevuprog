"use client";

import { useState, useEffect, useCallback } from "react";

export default function AdminPage() {
  const [bookings, setBookings] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  const [message, setMessage] = useState(null);

  const authHeader = typeof window !== "undefined"
    ? "Basic " + btoa("yasir:admin")
    : "";

  const fetchBookings = useCallback(async () => {
    try {
      const res = await fetch("/api/admin", {
        headers: { Authorization: authHeader },
      });

      if (res.status === 401) {
        setError("Yetkisiz erişim. Lütfen giriş yapınız.");
        return;
      }

      const data = await res.json();
      setBookings(data);
    } catch {
      setError("Veri yüklenemedi.");
    } finally {
      setLoading(false);
    }
  }, [authHeader]);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const handleDelete = async (slotId, oturum) => {
    if (!confirm(`"${oturum}" randevusunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    setDeleting(slotId);
    setMessage(null);

    try {
      const res = await fetch("/api/admin", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ slotId }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `${oturum} randevusu silindi.` });
        await fetchBookings();
      } else {
        setMessage({ type: "error", text: data.error || "Silme başarısız." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası." });
    } finally {
      setDeleting(null);
    }
  };

  const downloadJSON = () => {
    if (!bookings) return;
    const blob = new Blob([JSON.stringify(bookings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "randevular.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container">
        <div className="message error">{error}</div>
      </div>
    );
  }

  return (
    <div className="container">
      <header className="header">
        <div className="header-icon">🔐</div>
        <h1>Admin Panel</h1>
        <p className="subtitle">Tüm randevu kayıtları</p>
        <div className="info-badge">
          <span>📊</span> Toplam: {bookings?.toplam || 0} randevu
        </div>
      </header>

      <main className="admin-content">
        <div className="admin-actions">
          <button className="submit-btn" onClick={downloadJSON}>
            📥 JSON İndir
          </button>
          <a href="/" className="back-link">← Ana Sayfaya Dön</a>
        </div>

        {message && (
          <div className={`message ${message.type}`}>
            {message.text}
          </div>
        )}

        {bookings?.bookings?.length > 0 ? (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Oturum</th>
                    <th>Tarih</th>
                    <th>Saat</th>
                    <th>Öğrenci</th>
                    <th>Veli</th>
                    <th>Telefon</th>
                    <th>İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.bookings.map((b, i) => (
                    <tr key={i}>
                      <td data-label="Oturum">{b.oturum}</td>
                      <td data-label="Tarih">{b.tarih}</td>
                      <td data-label="Saat">{b.saat}</td>
                      <td data-label="Öğrenci">{b.studentName}</td>
                      <td data-label="Veli">{b.parentName}</td>
                      <td data-label="Telefon">{b.phone}</td>
                      <td data-label="İşlem">
                        <button
                          className="delete-btn"
                          onClick={() => handleDelete(b.slotId, b.oturum)}
                          disabled={deleting === b.slotId}
                        >
                          {deleting === b.slotId ? "⏳" : "🗑️ Sil"}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="json-preview">
              <h3>📄 JSON Görünümü</h3>
              <pre>{JSON.stringify(bookings, null, 2)}</pre>
            </div>
          </>
        ) : (
          <div className="empty-state">
            <span className="empty-icon">📭</span>
            <p>Henüz randevu alınmamış.</p>
          </div>
        )}
      </main>

      <footer className="footer">
        <p>Yasir Karaman — Veli Toplantısı 2026</p>
      </footer>
    </div>
  );
}
