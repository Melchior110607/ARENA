import { cn } from "@/lib/utils";
import {
  TRACEABILITY_STATUS_LABELS,
  type TraceabilityStatus,
} from "@/lib/types";

/**
 * The verification seal — Arena's signature mark.
 *
 * Every traceability claim carries one of three inspection stamps, and the
 * geometry changes before the colour does, so the gradient survives
 * grayscale, colour-blindness and a bad projector:
 *
 *   declared   — a dashed open ring. Stated by the company; nothing holds
 *                it yet.
 *   confirmed  — a solid ring around a check. Countersigned by the company
 *                upstream.
 *   verified   — a filled disc with the check struck through it, held in an
 *                outer ring. Checked by a third party; sealed.
 *
 * Use it wherever a traceability status appears. Pair with `showLabel`
 * whenever space allows; the mark alone is for tight tables where the column
 * header already names the meaning.
 */

const SEAL_COLOR: Record<TraceabilityStatus, string> = {
  declared: "var(--status-declared)",
  confirmed: "var(--status-confirmed)",
  verified: "var(--status-verified)",
};

function SealMark({
  status,
  size,
}: {
  status: TraceabilityStatus;
  size: number;
}) {
  const color = SEAL_COLOR[status];

  return (
    <svg
      viewBox="0 0 20 20"
      width={size}
      height={size}
      aria-hidden="true"
      className="shrink-0"
    >
      {status === "declared" && (
        <circle
          cx="10"
          cy="10"
          r="6.5"
          fill="none"
          stroke={color}
          strokeWidth="1.8"
          strokeDasharray="2.6 2.4"
          strokeLinecap="round"
        />
      )}
      {status === "confirmed" && (
        <>
          <circle cx="10" cy="10" r="6.5" fill="none" stroke={color} strokeWidth="1.8" />
          <path
            d="M6.9 10.2l2.1 2.1 4.1-4.4"
            fill="none"
            stroke={color}
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
      {status === "verified" && (
        <>
          <circle cx="10" cy="10" r="9" fill="none" stroke={color} strokeWidth="1.4" />
          <circle cx="10" cy="10" r="6.2" fill={color} />
          <path
            d="M7.2 10.2l1.9 1.9 3.7-4"
            fill="none"
            stroke="var(--card)"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </>
      )}
    </svg>
  );
}

export function StatusSeal({
  status,
  size = 16,
  showLabel = false,
  className,
}: {
  status: TraceabilityStatus;
  /** Mark diameter in px. */
  size?: number;
  /** Render the status name beside the mark. Prefer on wherever space allows. */
  showLabel?: boolean;
  className?: string;
}) {
  const label = TRACEABILITY_STATUS_LABELS[status];

  if (!showLabel) {
    return (
      <span
        role="img"
        aria-label={label}
        title={label}
        className={cn("inline-flex", className)}
      >
        <SealMark status={status} size={size} />
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <SealMark status={status} size={size} />
      <span
        className="arena-data"
        style={{ color: SEAL_COLOR[status] }}
      >
        {label}
      </span>
    </span>
  );
}
