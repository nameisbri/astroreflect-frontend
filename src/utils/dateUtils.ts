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

/**
 * Parses various date formats including PostgreSQL timestamps with timezone
 */
export const parseFlexibleDate = (dateValue: any): Date | null => {
  if (!dateValue) return null;

  try {
    // Handle string inputs
    if (typeof dateValue === "string") {
      // Check for PostgreSQL timestamp format with timezone (YYYY-MM-DD HH:MM:SS.sss-04)
      const pgTimestampRegex =
        /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d+)?(-\d{2})?$/;

      if (pgTimestampRegex.test(dateValue)) {
        // Direct conversion of PostgreSQL timestamp to ISO format
        // Replace space with T and ensure timezone is handled correctly
        let isoString = dateValue.replace(" ", "T");

        // If there's no timezone or it's not properly formatted, handle it
        if (!isoString.includes("Z") && !isoString.includes("+")) {
          // If it has a negative timezone like -04, it's already in proper format
          if (!/-\d{2}$/.test(isoString)) {
            isoString += "Z"; // Add Z for UTC if no timezone specified
          }
        }

        console.log("Converting PG timestamp to ISO:", isoString);
        const date = new Date(isoString);

        // Validate the parsed date
        if (!isNaN(date.getTime())) {
          return date;
        } else {
          console.warn("Failed to parse PostgreSQL timestamp:", dateValue);
          // Try one more fallback approach for PostgreSQL format
          const [datePart, timePart] = dateValue.split(" ");
          if (datePart && timePart) {
            return new Date(`${datePart}T${timePart}`);
          }
        }
      } else {
        // Standard date parsing for other formats
        const date = new Date(dateValue);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    } else if (dateValue instanceof Date) {
      // Already a date object
      return dateValue;
    }

    console.warn("Unparseable date format:", dateValue);
    return null;
  } catch (error) {
    console.error("Error parsing date:", dateValue, error);
    return null;
  }
};
