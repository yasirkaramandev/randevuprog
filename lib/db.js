// Veri erişim katmanı
// Production: Upstash Redis (@upstash/redis)
// Development: In-memory store

import { SLOTS } from "./slots";

// ---- In-Memory Store (Development) ----
const memoryStore = {};

function getMemoryBookings() {
  return { ...memoryStore };
}

function setMemoryBooking(slotId, data) {
  if (memoryStore[slotId]) {
    return false; // zaten dolu
  }
  memoryStore[slotId] = data;
  return true;
}

// ---- Redis Store (Production) ----
let redis = null;

async function getRedisClient() {
  if (redis) return redis;
  try {
    const { Redis } = await import("@upstash/redis");
    redis = new Redis({
      url: process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL,
      token:
        process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    return redis;
  } catch {
    return null;
  }
}

function isRedisConfigured() {
  return !!(
    (process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL) &&
    (process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN)
  );
}

// ---- Public API ----

/**
 * Tüm oturumları ve durumlarını getir
 * Returns: { slotId: { ...slotInfo, booked: boolean, booking?: {...} } }
 */
export async function getAllSlots() {
  const bookings = await getBookings();

  return SLOTS.map((slot) => ({
    ...slot,
    booked: !!bookings[slot.id],
    booking: bookings[slot.id] || null,
  }));
}

/**
 * Tüm randevuları getir
 */
export async function getBookings() {
  if (isRedisConfigured()) {
    const client = await getRedisClient();
    const data = await client.get("veli-toplantisi-bookings");
    return data || {};
  }
  return getMemoryBookings();
}

/**
 * Oturum rezervasyonu yap
 * Returns: { success: boolean, error?: string }
 */
export async function bookSlot(slotId, formData) {
  const { studentName, parentName, phone } = formData;

  // Slot geçerli mi kontrol et
  const validSlot = SLOTS.find((s) => s.id === slotId);
  if (!validSlot) {
    return { success: false, error: "Geçersiz oturum." };
  }

  // Form alanları kontrol
  if (!studentName || !parentName || !phone) {
    return { success: false, error: "Tüm alanları doldurunuz." };
  }

  const bookingData = {
    studentName,
    parentName,
    phone,
    slotLabel: validSlot.label,
    date: validSlot.date,
    start: validSlot.start,
    end: validSlot.end,
    bookedAt: new Date().toISOString(),
  };

  if (isRedisConfigured()) {
    const client = await getRedisClient();

    // Atomik okuma-yazma (race condition koruması)
    const existing = (await client.get("veli-toplantisi-bookings")) || {};
    if (existing[slotId]) {
      return { success: false, error: "Bu oturum zaten dolu." };
    }
    existing[slotId] = bookingData;
    await client.set("veli-toplantisi-bookings", existing);
    return { success: true };
  }

  // Memory store
  const result = setMemoryBooking(slotId, bookingData);
  if (!result) {
    return { success: false, error: "Bu oturum zaten dolu." };
  }
  return { success: true };
}

/**
 * Randevu silme
 * Returns: { success: boolean, error?: string }
 */
export async function deleteBooking(slotId) {
  const validSlot = SLOTS.find((s) => s.id === slotId);
  if (!validSlot) {
    return { success: false, error: "Geçersiz oturum." };
  }

  if (isRedisConfigured()) {
    const client = await getRedisClient();
    const existing = (await client.get("veli-toplantisi-bookings")) || {};
    if (!existing[slotId]) {
      return { success: false, error: "Bu oturumda randevu yok." };
    }
    delete existing[slotId];
    await client.set("veli-toplantisi-bookings", existing);
    return { success: true };
  }

  // Memory store
  if (!memoryStore[slotId]) {
    return { success: false, error: "Bu oturumda randevu yok." };
  }
  delete memoryStore[slotId];
  return { success: true };
}

/**
 * Tüm randevuları JSON formatında getir (admin için)
 */
export async function getBookingsJSON() {
  const bookings = await getBookings();
  const result = [];

  for (const slot of SLOTS) {
    if (bookings[slot.id]) {
      result.push({
        slotId: slot.id,
        oturum: slot.label,
        tarih: slot.date,
        saat: `${slot.start} - ${slot.end}`,
        ...bookings[slot.id],
      });
    }
  }

  return result;
}
