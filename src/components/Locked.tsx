import { useState } from 'react';
import './Locked.css';

/**
 * Small lock-icon badge with a hover tooltip. Use next to any label that
 * refers to a feature not yet available in Prodapt UI, so users see a
 * clear "not ready" signal instead of a broken link or dead page.
 */
export function LockedBadge({ tooltip }: { tooltip: string }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <span
      className="locked-badge"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      onFocus={() => setShowTooltip(true)}
      onBlur={() => setShowTooltip(false)}
      tabIndex={0}
      role="img"
      aria-label={tooltip}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M6 10V8a6 6 0 1 1 12 0v2h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1Zm2 0h8V8a4 4 0 0 0-8 0v2Z"
          fill="currentColor"
        />
      </svg>
      {showTooltip && <span className="locked-badge__tooltip">{tooltip}</span>}
    </span>
  );
}

/**
 * Sidebar nav item variant for sections that aren't wired up yet. Renders
 * as an inert <div>/<span> (never a <Link> or <a>) so it can't be clicked
 * or focused into navigating anywhere, paired with a LockedBadge that
 * explains why.
 */
export function LockedNavItem({ label, tooltip }: { label: string; tooltip: string }) {
  return (
    <div className="locked-nav-item" aria-disabled="true">
      <span className="locked-nav-item__label">{label}</span>
      <LockedBadge tooltip={tooltip} />
    </div>
  );
}
