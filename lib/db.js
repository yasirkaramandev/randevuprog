import { SLOTS } from "./slots";

const memoryStore = {};
const BOOKINGS_KEY = "veli-toplantisi-bookings";
const VALID_SLOT_IDS = new Set(SLOTS.map((slot) => slot.id));

function getMemoryBookings() {
  return { ...memoryStore };
}

function replaceMemoryBookings(bookings) {
  for (const key of Object.keys(memoryStore)) {
    delete memoryStore[key];
  }

  Object.assign(memoryStore, bookings);
}

function setMemoryBooking(slotId, data) {
  if (memoryStore[slotId]) {
    return false;
  }

  memoryStore[slotId] = data;
  return true;
}

function sanitizeBookings(bookings) {
  const sanitized = {};
  let changed = false;

  for (const [slotId, booking] of Object.entries(bookings || {})) {
    if (VALID_SLOT_IDS.has(slotId)) {
      sanitized[slotId] = booking;
    } else {
      changed = true;
    }
  }

  if (Object.keys(sanitized).length !== Object.keys(bookings || {}).length) {
    changed = true;
  }

  return { sanitized, changed };
}

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

export async function getAllSlots() {
  const bookings = await getBookings();

  return SLOTS.map((slot) => ({
    ...slot,
    booked: !!bookings[slot.id],
    booking: bookings[slot.id] || null,
  }));
}

export async function getBookings() {
  if (isRedisConfigured()) {
    const client = await getRedisClient();
    const data = (await client.get(BOOKINGS_KEY)) || {};
    const { sanitized, changed } = sanitizeBookings(data);

    if (changed) {
      await client.set(BOOKINGS_KEY, sanitized);
    }

    return sanitized;
  }

  const { sanitized, changed } = sanitizeBookings(getMemoryBookings());

  if (changed) {
    replaceMemoryBookings(sanitized);
  }

  return sanitized;
}

export async function bookSlot(slotId, formData) {
  const { studentName, parentName, phone } = formData;
  const validSlot = SLOTS.find((slot) => slot.id === slotId);

  if (!validSlot) {
    return { success: false, error: "Geçersiz oturum." };
  }

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
    const existing = await getBookings();

    if (existing[slotId]) {
      return { success: false, error: "Bu oturum zaten dolu." };
    }

    await client.set(BOOKINGS_KEY, {
      ...existing,
      [slotId]: bookingData,
    });

    return { success: true };
  }

  const result = setMemoryBooking(slotId, bookingData);

  if (!result) {
    return { success: false, error: "Bu oturum zaten dolu." };
  }

  return { success: true };
}

export async function deleteBooking(slotId) {
  const validSlot = SLOTS.find((slot) => slot.id === slotId);

  if (!validSlot) {
    return { success: false, error: "Geçersiz oturum." };
  }

  if (isRedisConfigured()) {
    const client = await getRedisClient();
    const existing = await getBookings();

    if (!existing[slotId]) {
      return { success: false, error: "Bu oturumda randevu yok." };
    }

    delete existing[slotId];
    await client.set(BOOKINGS_KEY, existing);
    return { success: true };
  }

  if (!memoryStore[slotId]) {
    return { success: false, error: "Bu oturumda randevu yok." };
  }

  delete memoryStore[slotId];
  return { success: true };
}

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
