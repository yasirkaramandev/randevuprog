export const SLOT_DURATION_MINUTES = 15;
export const BREAK_DURATION_MINUTES = 5;
export const SLOT_STEP_MINUTES = SLOT_DURATION_MINUTES + BREAK_DURATION_MINUTES;

export const DEFAULT_SCHEDULES = [
  {
    dateKey: "2026-04-20",
    start: "18:00",
    end: "19:30",
  },
  {
    dateKey: "2026-04-21",
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

export function formatDateLabel(dateKey) {
  const date = new Date(`${dateKey}T00:00:00Z`);
  const weekday = capitalize(WEEKDAY_FORMATTER.format(date));
  return `${DATE_FORMATTER.format(date)}, ${weekday}`;
}

export function toMinutes(time) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

export function toTime(minutes) {
  const hours = String(Math.floor(minutes / 60)).padStart(2, "0");
  const mins = String(minutes % 60).padStart(2, "0");
  return `${hours}:${mins}`;
}

export function buildScheduleId({ dateKey, start, end }) {
  return `schedule-${dateKey}-${start.replace(":", "")}-${end.replace(":", "")}`;
}

export function normalizeSchedule(schedule) {
  if (!schedule || typeof schedule !== "object") {
    return null;
  }

  const dateKey = String(schedule.dateKey || "").trim();
  const start = String(schedule.start || "").trim();
  const end = String(schedule.end || "").trim();

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) {
    return null;
  }

  if (!/^\d{2}:\d{2}$/.test(start) || !/^\d{2}:\d{2}$/.test(end)) {
    return null;
  }

  const startMinutes = toMinutes(start);
  const endMinutes = toMinutes(end);

  if (
    Number.isNaN(startMinutes) ||
    Number.isNaN(endMinutes) ||
    endMinutes <= startMinutes ||
    startMinutes < 0 ||
    endMinutes > 24 * 60
  ) {
    return null;
  }

  if (startMinutes + SLOT_DURATION_MINUTES > endMinutes) {
    return null;
  }

  return {
    id: schedule.id || buildScheduleId({ dateKey, start, end }),
    dateKey,
    start,
    end,
  };
}

export function getDefaultSchedules() {
  return DEFAULT_SCHEDULES.map((schedule) => normalizeSchedule(schedule));
}

export function buildSlotsFromSchedules(schedules) {
  const normalizedSchedules = schedules
    .map((schedule) => normalizeSchedule(schedule))
    .filter(Boolean)
    .sort((left, right) => {
      if (left.dateKey !== right.dateKey) {
        return left.dateKey.localeCompare(right.dateKey);
      }

      return left.start.localeCompare(right.start);
    });

  let labelIndex = 1;

  return normalizedSchedules.flatMap((schedule) => {
    const slots = [];
    const startMinutes = toMinutes(schedule.start);
    const endMinutes = toMinutes(schedule.end);
    const dateLabel = formatDateLabel(schedule.dateKey);

    for (
      let current = startMinutes;
      current + SLOT_DURATION_MINUTES <= endMinutes;
      current += SLOT_STEP_MINUTES
    ) {
      const start = toTime(current);
      const end = toTime(current + SLOT_DURATION_MINUTES);

      slots.push({
        id: `slot-${schedule.dateKey}-${start.replace(":", "")}`,
        scheduleId: schedule.id,
        label: `${labelIndex}. Oturum`,
        date: dateLabel,
        dateKey: schedule.dateKey,
        start,
        end,
      });

      labelIndex += 1;
    }

    return slots;
  });
}

export function getScheduleSummaries(schedules) {
  return schedules
    .map((schedule) => normalizeSchedule(schedule))
    .filter(Boolean)
    .sort((left, right) => {
      if (left.dateKey !== right.dateKey) {
        return left.dateKey.localeCompare(right.dateKey);
      }

      return left.start.localeCompare(right.start);
    })
    .map((schedule) => {
      const slots = buildSlotsFromSchedules([schedule]);

      return {
        ...schedule,
        dateLabel: formatDateLabel(schedule.dateKey),
        rangeLabel: `${schedule.start} - ${schedule.end}`,
        slotCount: slots.length,
        slotTimes: slots.map((slot) => `${slot.start} - ${slot.end}`),
      };
    });
}
