const SLOT_DURATION_MINUTES = 15;
const BREAK_DURATION_MINUTES = 5;
const SLOT_STEP_MINUTES = SLOT_DURATION_MINUTES + BREAK_DURATION_MINUTES;

const SCHEDULES = [
  {
    dateKey: "2026-04-21",
    start: "18:00",
    end: "19:00",
  },
  {
    dateKey: "2026-04-22",
    start: "17:00",
    end: "19:00",
  },
];

const DATE_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});

const WEEKDAY_FORMATTER = new Intl.DateTimeFormat("tr-TR", {
  weekday: "long",
  timeZone: "UTC",
});

function capitalize(value) {
  if (!value) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function formatDateLabel(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const weekday = capitalize(WEEKDAY_FORMATTER.format(date));
  return `${DATE_FORMATTER.format(date)}, ${weekday}`;
}

function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function toTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

function buildSlots() {
  let index = 1;

  return SCHEDULES.flatMap(({ dateKey, start, end }) => {
    const slots = [];
    const startMinutes = toMinutes(start);
    const endMinutes = toMinutes(end);
    const dateLabel = formatDateLabel(dateKey);

    for (
      let current = startMinutes;
      current + SLOT_DURATION_MINUTES <= endMinutes;
      current += SLOT_STEP_MINUTES
    ) {
      slots.push({
        id: `slot-${index}`,
        label: `${index}. Oturum`,
        date: dateLabel,
        dateKey,
        start: toTime(current),
        end: toTime(current + SLOT_DURATION_MINUTES),
      });

      index += 1;
    }

    return slots;
  });
}

export const SLOTS = buildSlots();

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
