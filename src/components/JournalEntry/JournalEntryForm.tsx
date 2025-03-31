import { useState, useEffect } from "react";
import { createJournalEntry } from "../../services/api";
import {
  getTransitKeywords,
  getJournalPrompts,
} from "../../utils/planetKeywords";
import { Planet } from "../../types/astrology";
import "./JournalEntry.scss";

interface JournalEntryProps {
  transitId: string;
  transitTypeId: string;
  onSave: () => void;
  onCancel: () => void;
  planetA?: Planet;
  planetB?: Planet;
  aspect?: string;
}

const JournalEntry = ({
  transitId,
  transitTypeId,
  onSave,
  onCancel,
  planetA,
  planetB,
  aspect,
}: JournalEntryProps) => {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPrompts, setShowPrompts] = useState(true);

  // Extract planet info from transitTypeId if not provided directly
  useEffect(() => {
    if (!planetA && transitTypeId) {
      // Parse transitTypeId to extract planets and aspects
      // Format is typically PLANETA_ASPECT_PLANETB or PLANET_IN_SIGN
      const parts = transitTypeId.split("_");
      if (parts.length >= 1) {
        // Extract planet names
      }
    }
  }, [transitTypeId, planetA, planetB]);

  // Predefined mood options
  const moodOptions = [
    "Reflective",
    "Energized",
    "Challenged",
    "Inspired",
    "Frustrated",
    "Peaceful",
    "Confused",
    "Determined",
    "Anxious",
    "Creative",
    "Balanced",
    "Uncertain",
  ];

  // Suggested tags based on transitTypeId
  const getSuggestedTags = () => {
    const tags: string[] = [];

    // Extract potential tags from transitTypeId
    if (transitTypeId) {
      const parts = transitTypeId.split("_");

      // Add planets as tags
      parts.forEach((part) => {
        if (
          [
            "SUN",
            "MOON",
            "MERCURY",
            "VENUS",
            "MARS",
            "JUPITER",
            "SATURN",
            "URANUS",
            "NEPTUNE",
            "PLUTO",
          ].includes(part)
        ) {
          tags.push(part.toLowerCase());
        }
      });

      // Add aspect types
      if (transitTypeId.includes("CONJUNCTION")) tags.push("conjunction");
      if (transitTypeId.includes("OPPOSITION")) tags.push("opposition");
      if (transitTypeId.includes("TRINE")) tags.push("trine");
      if (transitTypeId.includes("SQUARE")) tags.push("square");
      if (transitTypeId.includes("SEXTILE")) tags.push("sextile");

      // Other transit subtypes
      if (transitTypeId.includes("RETROGRADE")) tags.push("retrograde");
      if (transitTypeId.includes("INGRESS")) tags.push("ingress");
    }

    return tags;
  };

  // Get journal prompts
  const getPrompts = () => {
    if (!planetA) return [];

    return getJournalPrompts(planetA, planetB);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!content.trim()) {
      setError("Please enter some content for your journal entry");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Parse tags from comma-separated string
      const tagArray = tags
        .split(",")
        .map((tag) => tag.trim())
        .filter((tag) => tag.length > 0);

      await createJournalEntry({
        transitId,
        transitTypeId,
        content,
        mood: mood || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
      });

      onSave();
    } catch (err) {
      console.error("Error saving journal entry:", err);
      setError(
        err instanceof Error ? err.message : "An unexpected error occurred"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle custom mood input
  const handleCustomMoodChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const customMood = e.target.value.trim();
    if (customMood) {
      setMood(customMood);
    }
  };

  // Handle applying suggested tags
  const handleSuggestedTagClick = (tag: string) => {
    // Add the tag to the current tags
    const currentTags = tags ? tags.split(",").map((t) => t.trim()) : [];

    // Only add if not already included
    if (!currentTags.includes(tag)) {
      const newTags = [...currentTags, tag].join(", ");
      setTags(newTags);
    }
  };

  // Suggested tags component
  const SuggestedTags = () => {
    const suggestedTags = getSuggestedTags();

    if (suggestedTags.length === 0) return null;

    return (
      <div className="suggested-tags">
        <span className="suggested-label">Suggested tags:</span>
        <div className="tag-buttons">
          {suggestedTags.map((tag) => (
            <button
              key={tag}
              type="button"
              className="tag-button"
              onClick={() => handleSuggestedTagClick(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>
    );
  };

  // Journal prompts component
  const JournalPrompts = () => {
    const prompts = getPrompts();

    if (prompts.length === 0) return null;

    return (
      <div className="journal-prompts">
        <div className="prompts-header">
          <h4>Reflection Prompts</h4>
          <button
            type="button"
            className="toggle-prompts"
            onClick={() => setShowPrompts(!showPrompts)}
          >
            {showPrompts ? "Hide" : "Show"}
          </button>
        </div>

        {showPrompts && (
          <ul className="prompts-list">
            {prompts.map((prompt, index) => (
              <li key={index}>{prompt}</li>
            ))}
          </ul>
        )}
      </div>
    );
  };

  return (
    <div className="journal-entry-form">
      <div className="journal-form-header">
        <h2>New Journal Entry</h2>
        <button className="close-button" onClick={onCancel}>
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
        {/* Journal prompts to help the user reflect */}
        <JournalPrompts />

        <div className="form-group">
          <label htmlFor="mood">Mood</label>
          <div className="mood-selector">
            <select
              id="mood"
              value={mood}
              onChange={(e) => setMood(e.target.value)}
            >
              <option value="">Select your mood...</option>
              {moodOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
            <div className="custom-mood">
              <input
                type="text"
                placeholder="Or type a custom mood..."
                onChange={handleCustomMoodChange}
              />
            </div>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="content">Journal Entry</label>
          <textarea
            id="content"
            rows={8}
            placeholder="Write your reflections on this transit..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags">Tags (comma separated)</label>
          <input
            type="text"
            id="tags"
            placeholder="e.g. work, relationships, insights"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
          />
          <SuggestedTags />
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="form-actions">
          <button
            type="button"
            className="cancel-button"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Entry"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JournalEntry;
