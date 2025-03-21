import {
  Planet,
  Transit,
  PlanetPosition,
  JournalEntry,
  TransitType,
  CreateJournalEntryRequest,
  UpdateJournalEntryRequest,
} from "../types/astrology";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

// Error handling helper
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const errorMessage = errorData.error || `API error: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
};

// Transit-related API calls
export const fetchTransits = async (
  startDate?: Date,
  endDate?: Date,
  planets?: Planet[]
): Promise<Transit[]> => {
  // Prepare query parameters
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

  const response = await fetch(url);
  const data = await handleResponse(response);

  return data.transits;
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

// Journal-related API calls
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
