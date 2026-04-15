// Tüm veli toplantısı oturum tanımları
// 15 dk oturum + 5 dk mola = 20 dk aralık

export const SLOTS = [
  // 15 Nisan Cuma - 15:00 - 16:00
  {
    id: "slot-1",
    label: "1. Oturum",
    date: "15 Nisan 2026, Cuma",
    dateKey: "2026-04-15",
    start: "15:00",
    end: "15:15",
  },
  {
    id: "slot-2",
    label: "2. Oturum",
    date: "15 Nisan 2026, Cuma",
    dateKey: "2026-04-15",
    start: "15:20",
    end: "15:35",
  },
  {
    id: "slot-3",
    label: "3. Oturum",
    date: "15 Nisan 2026, Cuma",
    dateKey: "2026-04-15",
    start: "15:40",
    end: "15:55",
  },

  // 16 Nisan Cumartesi - 14:00 - 17:00
  {
    id: "slot-4",
    label: "4. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "14:00",
    end: "14:15",
  },
  {
    id: "slot-5",
    label: "5. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "14:20",
    end: "14:35",
  },
  {
    id: "slot-6",
    label: "6. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "14:40",
    end: "14:55",
  },
  {
    id: "slot-7",
    label: "7. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "15:00",
    end: "15:15",
  },
  {
    id: "slot-8",
    label: "8. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "15:20",
    end: "15:35",
  },
  {
    id: "slot-9",
    label: "9. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "15:40",
    end: "15:55",
  },
  {
    id: "slot-10",
    label: "10. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "16:00",
    end: "16:15",
  },
  {
    id: "slot-11",
    label: "11. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "16:20",
    end: "16:35",
  },
  {
    id: "slot-12",
    label: "12. Oturum",
    date: "16 Nisan 2026, Cumartesi",
    dateKey: "2026-04-16",
    start: "16:40",
    end: "16:55",
  },
];

// Tarihe göre grupla
export function getSlotsByDate() {
  const grouped = {};
  for (const slot of SLOTS) {
    if (!grouped[slot.dateKey]) {
      grouped[slot.dateKey] = {
        dateLabel: slot.date,
        slots: [],
      };
    }
    grouped[slot.dateKey].slots.push(slot);
  }
  return grouped;
}
