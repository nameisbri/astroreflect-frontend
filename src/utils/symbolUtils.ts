import { Planet } from "../types/astrology";

/**
 * Returns the astrological symbol for a planet
 */
export function getPlanetSymbol(planet: Planet): string {
  const planetSymbols: Record<Planet, string> = {
    [Planet.SUN]: "☉",
    [Planet.MOON]: "☽",
    [Planet.MERCURY]: "☿",
    [Planet.VENUS]: "♀",
    [Planet.MARS]: "♂",
    [Planet.JUPITER]: "♃",
    [Planet.SATURN]: "♄",
    [Planet.URANUS]: "♅",
    [Planet.NEPTUNE]: "♆",
    [Planet.PLUTO]: "♇",
  };
  return planetSymbols[planet] || planet.charAt(0);
}

/**
 * Returns the astrological symbol for an aspect
 */
export function getAspectSymbol(aspect: string): string {
  const aspectSymbols: Record<string, string> = {
    "Conjunction": "☌",
    "Sextile": "⚹",
    "Square": "□",
    "Trine": "△",
    "Opposition": "☍",
  };
  return aspectSymbols[aspect] || aspect.charAt(0);
}

/**
 * Returns the astrological symbol for a zodiac sign
 */
export function getZodiacSymbol(sign: string): string {
  const signSymbols: Record<string, string> = {
    "Aries": "♈",
    "Taurus": "♉",
    "Gemini": "♊",
    "Cancer": "♋",
    "Leo": "♌",
    "Virgo": "♍",
    "Libra": "♎",
    "Scorpio": "♏",
    "Sagittarius": "♐",
    "Capricorn": "♑",
    "Aquarius": "♒",
    "Pisces": "♓",
  };
  return signSymbols[sign] || sign.charAt(0);
}

/**
 * Returns the ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 */
export function getOrdinalSuffix(num: number): string {
  const j = num % 10;
  const k = num % 100;

  if (j === 1 && k !== 11) {
    return "st";
  }
  if (j === 2 && k !== 12) {
    return "nd";
  }
  if (j === 3 && k !== 13) {
    return "rd";
  }
  return "th";
}
