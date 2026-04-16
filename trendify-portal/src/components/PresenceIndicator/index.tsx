import { useMemo } from "react";
import { usePresence } from "@/hooks/usePresence";
import type { PresenceStatusType } from "@/provider/presence-context.shared";
import styles from "./styles.module.scss";

// ============================================================================
// TYPES
// ============================================================================

interface PresenceIndicatorProps {
  /** User ID to show presence for */
  userId: string;

  /** Indicator size */
  size?: "sm" | "md" | "lg";

  /**
   * Show "Active X ago" text below the indicator.
   * Only shown when user is offline and lastSeen is available.
   */
  showLastSeen?: boolean;

  /** Additional className for positioning */
  className?: string;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const SIZE_MAP = {
  sm: 8,
  md: 10,
  lg: 14,
};

const COLOR_MAP: Record<PresenceStatusType, string> = {
  online: "#22c55e",  // green-500
  idle: "#eab308",    // yellow-500
  offline: "#9ca3af", // gray-400
};

// ============================================================================
// HELPERS
// ============================================================================

function formatLastSeen(lastSeen?: Date): string | null {
  if (!lastSeen) return null;

  const diffMs = Date.now() - lastSeen.getTime();
  const diffMin = Math.floor(diffMs / 60_000);

  if (diffMin < 1) return "Active now";
  if (diffMin < 60) return `Active ${diffMin}m ago`;

  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `Active ${diffHours}h ago`;

  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Active yesterday";

  return `Active ${diffDays}d ago`;
}

// ============================================================================
// COMPONENT
// ============================================================================

/**
 * Visual presence indicator — colored dot placed next to an avatar.
 *
 * ● Green  (#22c55e) — Online
 * ● Yellow (#eab308) — Idle / Away
 * ● Gray   (#9ca3af) — Offline
 *
 * @example
 * ```tsx
 * <div className="avatar-wrapper">
 *   <Avatar src={user.avatar} />
 *   <PresenceIndicator userId={user.id} size="md" />
 * </div>
 * ```
 */
const PresenceIndicator = ({
  userId,
  size = "md",
  showLastSeen = false,
  className = "",
}: PresenceIndicatorProps) => {
  const { status, lastSeen } = usePresence(userId);

  const dotSize = SIZE_MAP[size];
  const color = COLOR_MAP[status];

  const lastSeenText = useMemo(() => {
    if (!showLastSeen || status !== "offline") return null;
    return formatLastSeen(lastSeen);
  }, [showLastSeen, status, lastSeen]);

  return (
    <span className={`${styles.wrapper} ${className}`}>
      <span
        className={`${styles.dot} ${status === "online" ? styles.pulse : ""}`}
        style={{
          width: dotSize,
          height: dotSize,
          backgroundColor: color,
        }}
        aria-label={`User is ${status}`}
      />
      {lastSeenText && (
        <span className={styles.lastSeen}>{lastSeenText}</span>
      )}
    </span>
  );
};

export default PresenceIndicator;
export { formatLastSeen };
export type { PresenceIndicatorProps };
