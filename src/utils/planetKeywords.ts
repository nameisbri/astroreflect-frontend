import { Planet } from "../types/astrology";

// Planet keywords based on the provided document
export const PLANET_KEYWORDS: Record<Planet, string[]> = {
  [Planet.SUN]: ["Identity", "Vitality", "Purpose"],
  [Planet.MOON]: ["Emotions", "Intuition", "Nurturing"],
  [Planet.MERCURY]: ["Communication", "Learning", "Thinking"],
  [Planet.VENUS]: ["Values", "Love", "Beauty"],
  [Planet.MARS]: ["Action", "Desire", "Energy"],
  [Planet.JUPITER]: ["Expansion", "Growth", "Opportunity"],
  [Planet.SATURN]: ["Structure", "Limitation", "Responsibility"],
  [Planet.URANUS]: ["Innovation", "Breakthroughs", "Freedom"],
  [Planet.NEPTUNE]: ["Spirituality", "Dreams", "Inspiration"],
  [Planet.PLUTO]: ["Transformation", "Power", "Rebirth"],
};

// Aspect meanings for reference
export const ASPECT_MEANINGS: Record<string, string> = {
  "Conjunction": "Blending of energies",
  "Sextile": "Opportunity and harmony",
  "Square": "Tension and growth",
  "Trine": "Flow and ease",
  "Opposition": "Balance and awareness",
};

/**
 * Returns focus areas for a transit based on planets involved
 */
export function getTransitKeywords(
  planetA: Planet,
  planetB?: Planet,
  aspectType?: string
): string {
  // Get keywords for the first planet
  const keywordsA = PLANET_KEYWORDS[planetA] || [];

  // If there's a second planet, get its keywords too
  const keywordsB = planetB ? PLANET_KEYWORDS[planetB] || [] : [];

  // Build a message about the planetary energies
  let message = `Focus on: ${keywordsA.join(", ")}`;

  if (keywordsB.length > 0) {
    message += ` and ${keywordsB.join(", ")}`;

    // Add aspect context if provided
    if (aspectType) {
      const aspectContext = ASPECT_MEANINGS[aspectType] || "";
      if (aspectContext) {
        message += ` (${aspectContext})`;
      }
    }
  }

  return message;
}

/**
 * Returns journal prompts based on planets in transit
 */
export function getJournalPrompts(planetA: Planet, planetB?: Planet): string[] {
  const prompts: string[] = [];

  // Add planet-specific prompts
  switch (planetA) {
    case Planet.SUN:
      prompts.push("How is your sense of self or purpose evolving?");
      break;
    case Planet.MOON:
      prompts.push("What emotions are you experiencing more strongly?");
      break;
    case Planet.MERCURY:
      prompts.push("How are your communication patterns changing?");
      break;
    case Planet.VENUS:
      prompts.push("What relationship dynamics are you noticing?");
      break;
    case Planet.MARS:
      prompts.push("Where are you directing your energy and action?");
      break;
    case Planet.JUPITER:
      prompts.push("What opportunities for growth are appearing?");
      break;
    case Planet.SATURN:
      prompts.push("What structures or limitations are you confronting?");
      break;
    case Planet.URANUS:
      prompts.push("What unexpected changes are happening?");
      break;
    case Planet.NEPTUNE:
      prompts.push("How is your spiritual awareness shifting?");
      break;
    case Planet.PLUTO:
      prompts.push("What deeper transformations are occurring?");
      break;
  }

  // Add combined prompts if two planets are involved
  if (planetB) {
    prompts.push(
      `How are the themes of ${planetA} and ${planetB} interacting in your life?`
    );
  }

  return prompts;
}
