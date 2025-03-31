import React from "react";
import "./ActionButton.scss";

interface ActionButtonProps {
  /**
   * Button text content
   */
  children: React.ReactNode;

  /**
   * Optional icon to display before text
   */
  icon?: string;

  /**
   * Optional badge count to display
   */
  badgeCount?: number;

  /**
   * Button variant - controls styling
   */
  variant: "primary" | "secondary" | "accent";

  /**
   * Click handler with event parameter
   */
  onClick: (e: React.MouseEvent<HTMLButtonElement>) => void;

  /**
   * Optional additional class names
   */
  className?: string;

  /**
   * Optional button type
   */
  type?: "button" | "submit" | "reset";

  /**
   * Whether the button is disabled
   */
  disabled?: boolean;
}

/**
 * ActionButton component with icon and badge support
 */
const ActionButton: React.FC<ActionButtonProps> = ({
  children,
  icon,
  badgeCount,
  variant = "primary",
  onClick,
  className = "",
  type = "button",
  disabled = false,
}) => {
  // Handle click with explicit stop propagation
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onClick(e);
  };

  return (
    <button
      type={type}
      className={`action-button ${variant} ${className}`}
      onClick={handleClick}
      disabled={disabled}
    >
      {icon && <span className="button-icon">{icon}</span>}
      <span className="button-text">{children}</span>
      {badgeCount !== undefined && badgeCount > 0 && (
        <span className="badge-count">{badgeCount}</span>
      )}
    </button>
  );
};

export default ActionButton;
