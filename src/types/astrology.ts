// Enums for astrological concepts
export enum Planet {
  SUN = "SUN",
  MOON = "MOON",
  MERCURY = "MERCURY",
  VENUS = "VENUS",
  MARS = "MARS",
  JUPITER = "JUPITER",
  SATURN = "SATURN",
  URANUS = "URANUS",
  NEPTUNE = "NEPTUNE",
  PLUTO = "PLUTO",
}

export enum Aspect {
  CONJUNCTION = "Conjunction",
  SEXTILE = "Sextile",
  SQUARE = "Square",
  TRINE = "Trine",
  OPPOSITION = "Opposition",
}

export enum TransitSubtype {
  STANDARD = "Standard",
  RETROGRADE = "Retrograde",
  DIRECT = "Direct",
  STATION = "Station",
  INGRESS = "Ingress",
  TRANSIT = "Transit",
}

export enum ZodiacSign {
  ARIES = "Aries",
  TAURUS = "Taurus",
  GEMINI = "Gemini",
  CANCER = "Cancer",
  LEO = "Leo",
  VIRGO = "Virgo",
  LIBRA = "Libra",
  SCORPIO = "Scorpio",
  SAGITTARIUS = "Sagittarius",
  CAPRICORN = "Capricorn",
  AQUARIUS = "Aquarius",
  PISCES = "Pisces",
}

export enum TransitTiming {
  ACTIVE = "Active", // Currently in effect
  APPLYING = "Applying", // Building toward exactitude
  SEPARATING = "Separating", // Moving away from exactitude
  UPCOMING = "Upcoming", // Not yet active but approaching
}

// Interfaces for astrological data
export interface Transit {
  id: string;
  transitTypeId: string;
  planetA: Planet;
  planetB?: Planet;
  aspect?: Aspect;
  sign?: ZodiacSign;
  subtype: TransitSubtype;
  exactDate: Date | string;
  startDate: Date | string;
  endDate: Date | string;
  description: string;
  timing?: TransitTiming;
  intensity?: number; // 0-100% measure of how strong the aspect is within its orb
}

export interface TransitType {
  id: string;
  planetA: Planet;
  planetB?: Planet;
  aspect?: Aspect;
  sign?: ZodiacSign;
  subtype: TransitSubtype;
  name: string;
  description: string;
}

export interface SignInfo {
  name: string;
  ruler: Planet;
  element: string;
  degreeInSign: number;
  percentInSign: number;
}

export interface RetrogradeInfo {
  isRetrograde: boolean;
  status: string;
  speed: number;
}

export interface Interpretation {
  keyThemes: string[];
  challenges: string[];
  opportunities: string[];
}

export interface HouseInfo {
  number: number;
  cusp: number;
  ruler: Planet;
  entryDate: Date | string;
  exitDate: Date | string;
}

export interface SignDuration {
  entryDate: Date | string;
  exitDate: Date | string;
}

export interface PlanetPosition {
  planet: Planet;
  longitude: number;
  latitude: number;
  distance: number;
  speed: number;
  speedDetails?: {
    longitude: number;
    latitude: number;
  };
  sign: SignInfo;
  retrograde: RetrogradeInfo;
  interpretation?: Interpretation;
  house?: HouseInfo;
  signDuration?: SignDuration;
}

export interface DailySnapshot {
  date: string;
  positions: PlanetPosition[];
  transits: Transit[];
}

export interface JournalEntry {
  id: string;
  transitId: string;
  transitTypeId?: string;
  content: string;
  mood?: string;
  tags?: string[];
  createdAt: Date | string;
  updatedAt: Date | string;
}

export interface CreateJournalEntryRequest {
  transitId: string;
  transitTypeId: string;
  content: string;
  mood?: string;
  tags?: string[];
}

export interface UpdateJournalEntryRequest {
  content?: string;
  mood?: string;
  tags?: string[];
}
