import { format, parseISO } from "date-fns";

/**
 * Safely formats a date that could be a string, Date object, or undefined
 * @param date The date to format
 * @param formatString The format string (date-fns format)
 * @param fallback Fallback string to display if date is invalid
 * @returns Formatted date string
 */
export const formatDate = (
  date: Date | string | undefined,
  formatString: string = "MMM d, yyyy",
  fallback: string = "Unknown date"
): string => {
  if (!date) return fallback;

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return format(dateObj, formatString);
  } catch (error) {
    console.error("Error formatting date:", error);
    return fallback;
  }
};

/**
 * Format a date as a short date (e.g., "Jan 15, 2025")
 */
export const formatShortDate = (date: Date | string | undefined): string => {
  return formatDate(date, "MMM d, yyyy");
};

/**
 * Format a date with time (e.g., "Jan 15, 2025 3:45 PM")
 */
export const formatDateTime = (date: Date | string | undefined): string => {
  return formatDate(date, "MMM d, yyyy h:mm a");
};

/**
 * Get date range as a string (e.g., "Jan 15 - Jan 20, 2025")
 */
export const formatDateRange = (
  startDate: Date | string | undefined,
  endDate: Date | string | undefined
): string => {
  if (!startDate || !endDate) return "Unknown date range";

  try {
    const start =
      typeof startDate === "string" ? parseISO(startDate) : startDate;
    const end = typeof endDate === "string" ? parseISO(endDate) : endDate;

    // If same year, only show year once
    if (start.getFullYear() === end.getFullYear()) {
      // If same month, only show month once
      if (start.getMonth() === end.getMonth()) {
        return `${format(start, "MMM d")} - ${format(end, "d, yyyy")}`;
      }
      return `${format(start, "MMM d")} - ${format(end, "MMM d, yyyy")}`;
    }

    // Different years
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  } catch (error) {
    console.error("Error formatting date range:", error);
    return "Unknown date range";
  }
};

/**
 * Determines if a date is in the past
 */
export const isPast = (date: Date | string | undefined): boolean => {
  if (!date) return false;

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return dateObj < new Date();
  } catch {
    return false;
  }
};

/**
 * Determines if a date is in the future
 */
export const isFuture = (date: Date | string | undefined): boolean => {
  if (!date) return false;

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    return dateObj > new Date();
  } catch {
    return false;
  }
};

/**
 * Determines if a date is today
 */
export const isToday = (date: Date | string | undefined): boolean => {
  if (!date) return false;

  try {
    const dateObj = typeof date === "string" ? parseISO(date) : date;
    const today = new Date();

    return (
      dateObj.getDate() === today.getDate() &&
      dateObj.getMonth() === today.getMonth() &&
      dateObj.getFullYear() === today.getFullYear()
    );
  } catch {
    return false;
  }
};
