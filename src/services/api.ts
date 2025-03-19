import axios from "axios";
import { Transit, JournalEntry, Planet } from "../types/astrology";

const API_URL = "http://localhost:3000/api";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Transit-related API calls
export const fetchTransits = async (
  startDate: Date,
  endDate: Date,
  orb: number = 2
): Promise<Transit[]> => {
  const response = await api.get("/ephemeris/transits", {
    params: {
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      orb,
    },
  });

  return response.data.transits;
};

export const fetchPlanetPosition = async (planet: Planet, date: Date) => {
  const response = await api.get("/ephemeris/planet", {
    params: {
      planet,
      date: date.toISOString(),
    },
  });

  return response.data.position;
};

// Journal-related API calls
export const createJournalEntry = async (
  entry: Omit<JournalEntry, "id" | "date">
): Promise<JournalEntry> => {
  const response = await api.post("/journal/entries", entry);
  return response.data;
};

export const fetchJournalEntriesForTransit = async (
  transitId: string
): Promise<JournalEntry[]> => {
  const response = await api.get(`/journal/entries/transit/${transitId}`);
  return response.data.entries;
};

export const fetchRecentJournalEntries = async (
  limit: number = 5
): Promise<JournalEntry[]> => {
  const response = await api.get("/journal/entries/recent", {
    params: { limit },
  });
  return response.data.entries;
};
