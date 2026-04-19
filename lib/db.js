import {
  buildSlotsFromSchedules,
  getDefaultSchedules,
  getScheduleSummaries,
  normalizeSchedule,
} from "./slots";

const BOOKINGS_KEY = "veli-toplantisi-bookings";
const SCHEDULES_KEY = "veli-toplantisi-schedules";

const memoryStore = {
  bookings: {},
  schedules: null,
};

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

function sortSchedules(schedules) {
  return [...schedules].sort((left, right) => {
    if (left.dateKey !== right.dateKey) {
      return left.dateKey.localeCompare(right.dateKey);
    }

    return left.start.localeCompare(right.start);
  });
}

function sanitizeSchedules(schedules) {
  const fallbackSchedules = getDefaultSchedules();

  if (schedules == null) {
    return { sanitized: fallbackSchedules, changed: true };
  }

  if (!Array.isArray(schedules)) {
    return { sanitized: fallbackSchedules, changed: true };
  }

  const normalized = schedules
    .map((schedule) => normalizeSchedule(schedule))
    .filter(Boolean);

  const uniqueById = new Map();

  for (const schedule of normalized) {
    if (!uniqueById.has(schedule.id)) {
      uniqueById.set(schedule.id, schedule);
    }
  }

  const sanitized = sortSchedules(Array.from(uniqueById.values()));
  const changed = JSON.stringify(sanitized) !== JSON.stringify(schedules);

  return { sanitized, changed };
}

function sanitizeBookings(bookings, slots) {
  const validSlotIds = new Set(slots.map((slot) => slot.id));
  const sanitized = {};
  let changed = false;

  for (const [slotId, booking] of Object.entries(bookings || {})) {
    if (validSlotIds.has(slotId)) {
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

async function persistSchedules(schedules) {
  if (isRedisConfigured()) {
    const client = await getRedisClient();
    await client.set(SCHEDULES_KEY, schedules);
    return;
  }

  memoryStore.schedules = schedules;
}

async function persistBookings(bookings) {
  if (isRedisConfigured()) {
    const client = await getRedisClient();
    await client.set(BOOKINGS_KEY, bookings);
    return;
  }

  memoryStore.bookings = bookings;
}

export async function getSchedules() {
  if (isRedisConfigured()) {
    const client = await getRedisClient();
    const data = await client.get(SCHEDULES_KEY);
    const { sanitized, changed } = sanitizeSchedules(data);

    if (changed) {
      await client.set(SCHEDULES_KEY, sanitized);
    }

    return sanitized;
  }

  const { sanitized, changed } = sanitizeSchedules(memoryStore.schedules);

  if (changed) {
    memoryStore.schedules = sanitized;
  }

  return sanitized;
}

export async function getScheduleSummariesForAdmin() {
  const schedules = await getSchedules();
  return getScheduleSummaries(schedules);
}

export async function getSlots() {
  const schedules = await getSchedules();
  return buildSlotsFromSchedules(schedules);
}

export async function getAllSlots() {
  const [slots, bookings] = await Promise.all([getSlots(), getBookings()]);

  return slots.map((slot) => ({
    ...slot,
    booked: !!bookings[slot.id],
    booking: bookings[slot.id] || null,
  }));
}

export async function getBookings() {
  const slots = await getSlots();

  if (isRedisConfigured()) {
    const client = await getRedisClient();
    const data = (await client.get(BOOKINGS_KEY)) || {};
    const { sanitized, changed } = sanitizeBookings(data, slots);

    if (changed) {
      await client.set(BOOKINGS_KEY, sanitized);
    }

    return sanitized;
  }

  const { sanitized, changed } = sanitizeBookings(memoryStore.bookings, slots);

  if (changed) {
    memoryStore.bookings = sanitized;
  }

  return sanitized;
}

export async function addSchedule(scheduleInput) {
  const nextSchedule = normalizeSchedule(scheduleInput);

  if (!nextSchedule) {
    return { success: false, error: "Geçerli bir tarih ve saat aralığı giriniz." };
  }

  const schedules = await getSchedules();

  if (schedules.some((schedule) => schedule.id === nextSchedule.id)) {
    return { success: false, error: "Bu tarih ve saat aralığı zaten mevcut." };
  }

  const existingSlotIds = new Set(
    buildSlotsFromSchedules(schedules).map((slot) => slot.id)
  );
  const nextSlotIds = buildSlotsFromSchedules([nextSchedule]).map(
    (slot) => slot.id
  );

  if (nextSlotIds.some((slotId) => existingSlotIds.has(slotId))) {
    return {
      success: false,
      error: "Bu saat aralığı mevcut programlarla çakışıyor.",
    };
  }

  const nextSchedules = sortSchedules([...schedules, nextSchedule]);
  await persistSchedules(nextSchedules);
  await getBookings();

  return { success: true };
}

export async function deleteSchedule(scheduleId) {
  const schedules = await getSchedules();
  const nextSchedules = schedules.filter((schedule) => schedule.id !== scheduleId);

  if (nextSchedules.length === schedules.length) {
    return { success: false, error: "Program bulunamadı." };
  }

  await persistSchedules(nextSchedules);
  await getBookings();

  return { success: true };
}

export async function bookSlot(slotId, formData) {
  const { studentName, parentName, phone } = formData;
  const slots = await getSlots();
  const validSlot = slots.find((slot) => slot.id === slotId);

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

  const existing = await getBookings();

  if (existing[slotId]) {
    return { success: false, error: "Bu oturum zaten dolu." };
  }

  await persistBookings({
    ...existing,
    [slotId]: bookingData,
  });

  return { success: true };
}

export async function deleteBooking(slotId) {
  const slots = await getSlots();
  const validSlot = slots.find((slot) => slot.id === slotId);

  if (!validSlot) {
    return { success: false, error: "Geçersiz oturum." };
  }

  const existing = await getBookings();

  if (!existing[slotId]) {
    return { success: false, error: "Bu oturumda randevu yok." };
  }

  delete existing[slotId];
  await persistBookings(existing);

  return { success: true };
}

export async function getBookingsJSON() {
  const [slots, bookings] = await Promise.all([getSlots(), getBookings()]);
  const result = [];

  for (const slot of slots) {
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
