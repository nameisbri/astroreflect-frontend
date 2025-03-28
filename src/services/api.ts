import {
  Planet,
  Transit,
  PlanetPosition,
  JournalEntry,
  TransitType,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
  Aspect,
  TransitSubtype,
  TransitTiming,
} from "../types/astrology";
import { format, parseISO } from "date-fns";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `API error: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

const MOCK_TRANSITS: Transit[] = [
  {
    id: "transit-1",
    transitTypeId: "SUN_Square_MARS",
    planetA: Planet.SUN,
    planetB: Planet.MARS,
    aspect: Aspect.SQUARE,
    subtype: TransitSubtype.STANDARD,
    timing: TransitTiming.APPLYING,
    intensity: 80,
    exactDate: "2025-03-21T12:30:00.000Z",
    startDate: "2025-03-20T00:00:00.000Z",
    endDate: "2025-03-22T23:59:59.999Z",
    description:
      "Sun creates tension with Mars, challenging you to overcome obstacles and grow through difficulty.",
  },
  {
    id: "transit-2",
    transitTypeId: "MOON_Trine_VENUS",
    planetA: Planet.MOON,
    planetB: Planet.VENUS,
    aspect: Aspect.TRINE,
    subtype: TransitSubtype.STANDARD,
    timing: TransitTiming.ACTIVE,
    intensity: 75,
    exactDate: "2025-03-15T08:15:00.000Z",
    startDate: "2025-03-14T12:00:00.000Z",
    endDate: "2025-03-16T16:30:00.000Z",
    description:
      "Moon harmonizes with Venus, enhancing emotional connections and creativity.",
  },
  {
    id: "transit-3",
    transitTypeId: "MERCURY_Conjunction_JUPITER",
    planetA: Planet.MERCURY,
    planetB: Planet.JUPITER,
    aspect: Aspect.CONJUNCTION,
    subtype: TransitSubtype.STANDARD,
    timing: TransitTiming.SEPARATING,
    intensity: 90,
    exactDate: "2025-03-10T10:45:00.000Z",
    startDate: "2025-03-09T06:00:00.000Z",
    endDate: "2025-03-11T18:00:00.000Z",
    description:
      "Mercury joins Jupiter, expanding mental horizons and bringing optimistic communication.",
  },
];

export const fetchTransits = async (
  startDate?: Date,
  endDate?: Date,
  planets?: Planet[]
): Promise<Transit[]> => {
  const params = new URLSearchParams();

  if (startDate) {
    params.append("startDate", startDate.toISOString());
  }

  if (endDate) {
    params.append("endDate", endDate.toISOString());
  }

  if (planets && planets.length > 0) {
    params.append("planets", planets.join(","));
  }

  const url = `${API_URL}/ephemeris/transits${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  console.log("Calling API: ", url);

  try {
    const response = await fetch(url);
    const data = await handleResponse(response);
    console.log("API response:", data);
    return data.transits;
  } catch (error) {
    console.error("Error fetching transits from API:", error);
    console.log("Using mock transit data instead");

    if (startDate && endDate) {
      const start = startDate.getTime();
      const end = endDate.getTime();

      return MOCK_TRANSITS.filter((transit) => {
        const transitStart = new Date(transit.startDate).getTime();
        const transitEnd = new Date(transit.endDate).getTime();

        return transitStart <= end && transitEnd >= start;
      });
    }

    return MOCK_TRANSITS;
  }
};

export const fetchPlanetPosition = async (
  planet: Planet,
  date?: Date
): Promise<PlanetPosition> => {
  const params = new URLSearchParams({
    planet: planet.toString(),
  });

  if (date) {
    params.append("date", date.toISOString());
  }

  const url = `${API_URL}/ephemeris/planet?${params.toString()}`;

  const response = await fetch(url);
  const data = await handleResponse(response);

  return data.position;
};

export const createJournalEntry = async (
  entry: CreateJournalEntryRequest
): Promise<JournalEntry> => {
  const response = await fetch(`${API_URL}/journal/entries`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(entry),
  });

  return handleResponse(response);
};

export const fetchJournalEntriesForTransit = async (
  transitId: string
): Promise<JournalEntry[]> => {
  const response = await fetch(
    `${API_URL}/journal/entries/transit/${transitId}`
  );
  const data = await handleResponse(response);

  return data.entries || [];
};

export const fetchJournalEntriesForTransitType = async (
  transitTypeId: string
): Promise<{ transitType: TransitType; entries: JournalEntry[] }> => {
  const response = await fetch(
    `${API_URL}/journal/entries/transit-type/${transitTypeId}`
  );
  return handleResponse(response);
};

export const fetchRecentJournalEntries = async (
  limit: number = 5
): Promise<JournalEntry[]> => {
  const response = await fetch(
    `${API_URL}/journal/entries/recent?limit=${limit}`
  );
  const data = await handleResponse(response);

  return data.entries || [];
};

export const fetchJournalEntryById = async (
  entryId: string
): Promise<JournalEntry> => {
  const response = await fetch(`${API_URL}/journal/entries/${entryId}`);
  return handleResponse(response);
};

export const updateJournalEntry = async (
  entryId: string,
  updates: UpdateJournalEntryRequest
): Promise<JournalEntry> => {
  const response = await fetch(`${API_URL}/journal/entries/${entryId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(updates),
  });

  return handleResponse(response);
};

export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  const response = await fetch(`${API_URL}/journal/entries/${entryId}`, {
    method: "DELETE",
  });

  if (response.status !== 204) {
    await handleResponse(response);
  }
};

export const fetchJournalEntriesByTag = async (
  tag: string,
  limit: number = 20
): Promise<JournalEntry[]> => {
  const response = await fetch(
    `${API_URL}/journal/entries/tag/${tag}?limit=${limit}`
  );
  const data = await handleResponse(response);

  return data.entries || [];
};

export const searchJournalEntries = async (
  query: string,
  limit: number = 20
): Promise<JournalEntry[]> => {
  const params = new URLSearchParams({
    query,
    limit: limit.toString(),
  });

  const response = await fetch(
    `${API_URL}/journal/entries/search?${params.toString()}`
  );
  const data = await handleResponse(response);

  return data.entries || [];
};

export const fetchDailySnapshot = async (
  date?: Date
): Promise<{
  date: string;
  positions: PlanetPosition[];
  transits: Transit[];
}> => {
  const params = new URLSearchParams();

  if (date) {
    params.append("date", date.toISOString());
  }

  const url = `${API_URL}/ephemeris/daily-snapshot${
    params.toString() ? `?${params.toString()}` : ""
  }`;

  try {
    const response = await fetch(url);
    const data = await handleResponse(response);
    return data;
  } catch (error) {
    console.error("Error fetching daily snapshot:", error);

    return {
      date: new Date().toISOString(),
      positions: [],
      transits: MOCK_TRANSITS,
    };
  }
};

// Function to fetch journal entries for a specific date
export const fetchJournalEntriesByDate = async (
  date: Date
): Promise<JournalEntry[]> => {
  // Format date as YYYY-MM-DD
  const formattedDate = format(date, "yyyy-MM-dd");

  try {
    const response = await fetch(
      `${API_URL}/journal/entries/date/${formattedDate}`
    );
    const data = await handleResponse(response);
    return data.entries || [];
  } catch (error) {
    console.error(
      `Error fetching journal entries for date ${formattedDate}:`,
      error
    );
    return []; // Return empty array on error
  }
};

// Function to fetch journal entries for multiple dates (useful for calendar view)
export const fetchJournalEntriesForDateRange = async (
  startDate: Date,
  endDate: Date
): Promise<Record<string, JournalEntry[]>> => {
  // Create array of all dates in the range
  const dates: Date[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    dates.push(new Date(currentDate));
    currentDate.setDate(currentDate.getDate() + 1);
  }

  // Create map to store entries by date
  const entriesByDate: Record<string, JournalEntry[]> = {};

  // Fetch entries for each date
  await Promise.all(
    dates.map(async (date) => {
      const dateKey = format(date, "yyyy-MM-dd");
      try {
        const entries = await fetchJournalEntriesByDate(date);
        entriesByDate[dateKey] = entries;
      } catch (error) {
        console.error(`Error fetching entries for ${dateKey}:`, error);
        entriesByDate[dateKey] = [];
      }
    })
  );

  return entriesByDate;
};
