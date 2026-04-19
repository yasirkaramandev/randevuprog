"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY = "admin-basic-auth";
const EMPTY_LOGIN_FORM = {
  username: "",
  password: "",
};

export default function AdminPage() {
  const [bookings, setBookings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authHeader, setAuthHeader] = useState("");
  const [loginForm, setLoginForm] = useState(EMPTY_LOGIN_FORM);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [authSubmitting, setAuthSubmitting] = useState(false);
  const [excelDownloading, setExcelDownloading] = useState(false);

  const handleLogout = useCallback((nextError = null) => {
    window.sessionStorage.removeItem(STORAGE_KEY);
    setAuthHeader("");
    setBookings(null);
    setMessage(null);
    setError(nextError);
    setLoginForm(EMPTY_LOGIN_FORM);
    setLoading(false);
  }, []);

  const fetchBookings = useCallback(async (headerValue) => {
    if (!headerValue) {
      setLoading(false);
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/admin", {
        headers: { Authorization: headerValue },
        cache: "no-store",
      });

      if (res.status === 401) {
        handleLogout("Kullanıcı adı veya şifre hatalı.");
        return false;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Veri yüklenemedi.");
        return false;
      }

      setBookings(data);
      return true;
    } catch {
      setError("Veri yüklenemedi.");
      return false;
    } finally {
      setLoading(false);
    }
  }, [handleLogout]);

  useEffect(() => {
    const savedAuthHeader = window.sessionStorage.getItem(STORAGE_KEY) || "";

    if (!savedAuthHeader) {
      setLoading(false);
      return;
    }

    setAuthHeader(savedAuthHeader);
    void fetchBookings(savedAuthHeader);
  }, [fetchBookings]);

  async function handleLogin(event) {
    event.preventDefault();
    setAuthSubmitting(true);
    setMessage(null);
    setError(null);

    const nextAuthHeader = `Basic ${btoa(
      `${loginForm.username}:${loginForm.password}`
    )}`;

    const success = await fetchBookings(nextAuthHeader);

    if (success) {
      window.sessionStorage.setItem(STORAGE_KEY, nextAuthHeader);
      setAuthHeader(nextAuthHeader);
      setLoginForm(EMPTY_LOGIN_FORM);
      setMessage({ type: "success", text: "Admin paneline giriş yapıldı." });
    }

    setAuthSubmitting(false);
  }

  async function handleDelete(slotId, oturum) {
    if (!confirm(`"${oturum}" randevusunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    setDeleting(slotId);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/admin", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ slotId }),
      });

      if (res.status === 401) {
        handleLogout("Oturum süresi doldu. Tekrar giriş yapınız.");
        return;
      }

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: `${oturum} randevusu silindi.` });
        await fetchBookings(authHeader);
      } else {
        setMessage({ type: "error", text: data.error || "Silme başarısız." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası." });
    } finally {
      setDeleting(null);
    }
  }

  async function handleExcelDownload() {
    setExcelDownloading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/export", {
        headers: { Authorization: authHeader },
      });

      if (res.status === 401) {
        handleLogout("Oturum süresi doldu. Tekrar giriş yapınız.");
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        setMessage({
          type: "error",
          text: data?.error || "Excel indirilemedi.",
        });
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = "randevular.xlsx";
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      setMessage({ type: "error", text: "Excel indirilemedi." });
    } finally {
      setExcelDownloading(false);
    }
  }

  function downloadJSON() {
    if (!bookings) return;

    const blob = new Blob([JSON.stringify(bookings, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = "randevular.json";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  if (!authHeader) {
    return (
      <div className="container">
        <header className="header">
          <div className="header-icon">🔐</div>
          <h1>Admin Panel</h1>
          <p className="subtitle">Randevulara erişmek için giriş yapın</p>
        </header>

        <main className="admin-login-shell">
          <section className="admin-login-card">
            <h2>Giriş Yap</h2>
            <p className="admin-login-copy">
              Admin kayıtlarını görüntülemek, silmek ve Excel olarak indirmek
              için kullanıcı adı ve şifre giriniz.
            </p>

            {error && <div className="message error">{error}</div>}
            {message && <div className={`message ${message.type}`}>{message.text}</div>}

            <form className="admin-login-form" onSubmit={handleLogin}>
              <div className="form-group">
                <label htmlFor="username">Kullanıcı Adı</label>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  placeholder="Yasir"
                  required
                  value={loginForm.username}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      username: event.target.value,
                    }))
                  }
                />
              </div>

              <div className="form-group">
                <label htmlFor="password">Şifre</label>
                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Yasir"
                  required
                  value={loginForm.password}
                  onChange={(event) =>
                    setLoginForm((current) => ({
                      ...current,
                      password: event.target.value,
                    }))
                  }
                />
              </div>

              <button className="submit-btn" type="submit" disabled={authSubmitting}>
                {authSubmitting ? (
                  <>
                    <span className="btn-spinner"></span> Giriş yapılıyor...
                  </>
                ) : (
                  "Panele Gir"
                )}
              </button>
            </form>
          </section>
        </main>
      </div>
    );
  }

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
          <div className="admin-action-row">
            <button
              className="submit-btn"
              onClick={handleExcelDownload}
              disabled={excelDownloading}
            >
              {excelDownloading ? "Excel hazırlanıyor..." : "📥 Excel İndir"}
            </button>
            <button className="secondary-btn" onClick={downloadJSON}>
              JSON İndir
            </button>
          </div>

          <div className="admin-action-row">
            <Link href="/" className="back-link">
              ← Ana Sayfaya Dön
            </Link>
            <button className="logout-btn" onClick={() => handleLogout()}>
              Çıkış Yap
            </button>
          </div>
        </div>

        {error && <div className="message error">{error}</div>}
        {message && <div className={`message ${message.type}`}>{message.text}</div>}

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
                  {bookings.bookings.map((booking) => (
                    <tr key={booking.slotId}>
                      <td data-label="Oturum">{booking.oturum}</td>
                      <td data-label="Tarih">{booking.tarih}</td>
                      <td data-label="Saat">{booking.saat}</td>
                      <td data-label="Öğrenci">{booking.studentName}</td>
                      <td data-label="Veli">{booking.parentName}</td>
                      <td data-label="Telefon">{booking.phone}</td>
                      <td data-label="İşlem">
                        <button
                          className="delete-btn"
                          onClick={() =>
                            handleDelete(booking.slotId, booking.oturum)
                          }
                          disabled={deleting === booking.slotId}
                        >
                          {deleting === booking.slotId ? "⏳" : "🗑️ Sil"}
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
    </div>
  );
}
