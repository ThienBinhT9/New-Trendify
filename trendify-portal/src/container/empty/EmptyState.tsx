import React from "react";
import "./EmptyState.scss";

type EmptyStateVariant = "green" | "blue" | "amber" | "gray" | "purple";

interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  ctaLabel: string;
  onCtaClick: () => void;
  variant?: EmptyStateVariant;
  className?: string;
}

const EmptyState = (props: EmptyStateProps) => {
  const {
    icon,
    title,
    description,
    ctaLabel,
    onCtaClick,
    variant = "green",
    className = "",
  } = props;

  return (
    <div className={`empty-state ${className}`}>
      <div className={`empty-state__icon empty-state__icon--${variant}`}>{icon}</div>
      <p className="empty-state__title">{title}</p>
      <p className="empty-state__desc">{description}</p>
      <button className={`empty-state__cta empty-state__cta--${variant}`} onClick={onCtaClick}>
        {ctaLabel}
      </button>
    </div>
  );
};

export default EmptyState;
