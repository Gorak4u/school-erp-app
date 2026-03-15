type ParseDateOptions = {
  endOfDay?: boolean;
};

const toIsoString = (year: string, month: string, day: string, endOfDay: boolean) => {
  const paddedYear = year.padStart(4, '0');
  const paddedMonth = month.padStart(2, '0');
  const paddedDay = day.padStart(2, '0');
  const time = endOfDay ? '23:59:59.999' : '00:00:00.000';
  return `${paddedYear}-${paddedMonth}-${paddedDay}T${time}Z`;
};

const normaliseDate = (date: Date, endOfDay: boolean) => {
  const normalised = new Date(date.getTime());
  if (Number.isNaN(normalised.getTime())) {
    return null;
  }
  if (endOfDay) {
    normalised.setUTCHours(23, 59, 59, 999);
  } else {
    normalised.setUTCHours(0, 0, 0, 0);
  }
  return normalised;
};

export const parseDateParam = (value?: string | null, options: ParseDateOptions = {}) => {
  if (!value) return null;
  const { endOfDay = false } = options;

  // Try DD/MM/YYYY format first (common in many countries)
  if (value.includes('/')) {
    const [day, month, year] = value.split('/');
    if (day && month && year) {
      const isoString = toIsoString(year, month, day, endOfDay);
      const parsed = new Date(isoString);
      if (!Number.isNaN(parsed.getTime())) {
        return parsed;
      }
    }
  }

  // Fallback to direct parsing for ISO dates (YYYY-MM-DD)
  const directParse = normaliseDate(new Date(value), endOfDay);
  if (directParse) {
    return directParse;
  }

  return null;
};
