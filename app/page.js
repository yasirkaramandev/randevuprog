"use client";

import { useState, useEffect, useCallback } from "react";

export default function Home() {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [formData, setFormData] = useState({
    studentName: "",
    parentName: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  const fetchSlots = useCallback(async () => {
    try {
      const res = await fetch("/api/slots");
      const data = await res.json();
      setSlots(data.slots || []);
    } catch {
      setMessage({ type: "error", text: "Oturumlar yüklenemedi." });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [fetchSlots]);

  const handleSelect = (slot) => {
    if (slot.booked) return;
    setSelectedSlot(slot);
    setFormData({ studentName: "", parentName: "", phone: "" });
    setMessage(null);
  };

  const handleClose = () => {
    setSelectedSlot(null);
    setFormData({ studentName: "", parentName: "", phone: "" });
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slotId: selectedSlot.id,
          ...formData,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        setMessage({ type: "success", text: "✅ Randevunuz başarıyla alındı!" });
        setSelectedSlot(null);
        setFormData({ studentName: "", parentName: "", phone: "" });
        await fetchSlots();
      } else {
        setMessage({ type: "error", text: data.error || "Bir hata oluştu." });
      }
    } catch {
      setMessage({ type: "error", text: "Bağlantı hatası. Tekrar deneyiniz." });
    } finally {
      setSubmitting(false);
    }
  };

  // Tarihe göre grupla
  const groupedSlots = slots.reduce((acc, slot) => {
    if (!acc[slot.dateKey]) {
      acc[slot.dateKey] = { dateLabel: slot.date, slots: [] };
    }
    acc[slot.dateKey].slots.push(slot);
    return acc;
  }, {});

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
        <div className="header-icon">📅</div>
        <h1>Veli Toplantısı Randevu</h1>
        <p className="subtitle">
          Uygun bir oturum seçerek randevunuzu oluşturun
        </p>
        <div className="info-badge">
          <span>⏱️</span> Her oturum 15 dk + 5 dk mola
        </div>
        <p className="subtitle" style={{marginTop: '16px', color: '#1e293b', fontWeight: '500'}}>
          💻 Toplantılar <strong>Google Meet</strong> üzerinden yapılacaktır.<br/>
          📲 Toplantı zamanı geldiğinde, girdiğiniz telefon numarasına WhatsApp üzerinden katılım linki iletilecektir.
        </p>
      </header>

      {message && !selectedSlot && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <main className="slots-container">
        {Object.entries(groupedSlots).map(([dateKey, group]) => (
          <section key={dateKey} className="day-group">
            <h2 className="day-title">
              <span className="day-icon">📆</span>
              {group.dateLabel}
            </h2>
            <div className="slots-grid">
              {group.slots.map((slot) => (
                <button
                  key={slot.id}
                  className={`slot-card ${slot.booked ? "booked" : "available"}`}
                  onClick={() => handleSelect(slot)}
                  disabled={slot.booked}
                >
                  <div className="slot-label">{slot.label}</div>
                  <div className="slot-time">
                    🕐 {slot.start} - {slot.end}
                  </div>
                  <div className={`slot-status ${slot.booked ? "status-booked" : "status-available"}`}>
                    {slot.booked ? "🔒 Dolu" : "✅ Müsait"}
                  </div>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {/* Modal Form */}
      {selectedSlot && (
        <div className="modal-overlay" onClick={handleClose}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={handleClose}>
              ✕
            </button>
            <h2 className="modal-title">Randevu Formu</h2>
            <div className="modal-slot-info">
              <span className="modal-slot-badge">{selectedSlot.label}</span>
              <span>{selectedSlot.date}</span>
              <span>🕐 {selectedSlot.start} - {selectedSlot.end}</span>
            </div>

            {message && (
              <div className={`message ${message.type}`}>
                {message.text}
              </div>
            )}

            <form onSubmit={handleSubmit} className="booking-form">
              <div className="form-group">
                <label htmlFor="studentName">👨‍🎓 Öğrenci Adı Soyadı</label>
                <input
                  id="studentName"
                  type="text"
                  required
                  placeholder="Örn: Ali Yılmaz"
                  value={formData.studentName}
                  onChange={(e) =>
                    setFormData({ ...formData, studentName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="parentName">👤 Veli Adı Soyadı</label>
                <input
                  id="parentName"
                  type="text"
                  required
                  placeholder="Örn: Mehmet Yılmaz"
                  value={formData.parentName}
                  onChange={(e) =>
                    setFormData({ ...formData, parentName: e.target.value })
                  }
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">📱 Telefon Numarası</label>
                <input
                  id="phone"
                  type="tel"
                  required
                  placeholder="Örn: 0532 123 4567"
                  value={formData.phone}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="submit-btn"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <span className="btn-spinner"></span> Kaydediliyor...
                  </>
                ) : (
                  "📩 Randevuyu Onayla"
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      <footer className="footer">
        <p>Yasir Karaman — Veli Toplantısı 2026</p>
      </footer>
    </div>
  );
}
