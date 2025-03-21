import { useState } from "react";
import { createJournalEntry } from "../../services/api";
import "./JournalEntry.scss";

interface JournalEntryProps {
  transitId: string;
  transitTypeId: string;
  onSave: () => void;
  onCancel: () => void;
}

const JournalEntry = ({
  transitId,
  transitTypeId,
  onSave,
  onCancel,
}: JournalEntryProps) => {
  const [content, setContent] = useState("");
  const [mood, setMood] = useState("");
  const [tags, setTags] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  return (
    <div className="journal-entry-form">
      <div className="journal-form-header">
        <h2>New Journal Entry</h2>
        <button className="close-button" onClick={onCancel}>
          ×
        </button>
      </div>

      <form onSubmit={handleSubmit}>
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
