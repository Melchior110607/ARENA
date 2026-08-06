import { cn } from "@/lib/utils";
import type { Logo } from "@/lib/types";

/**
 * Company mark: a foundry nameplate. Tinted plate in the company's tone,
 * a fine inner rule, and the monogram struck in the tone's drawing ink.
 * Pure SVG — Arena has no images, anywhere, ever.
 */

const clampTone = (tone: number) => Math.min(5, Math.max(0, Math.round(tone)));

export function Monogram({
  logo,
  size = 32,
  className,
  ...props
}: {
  logo: Logo;
  /** Rendered size in px. The drawing scales crisply. */
  size?: number;
} & Omit<React.ComponentProps<"svg">, "children">) {
  const tone = clampTone(logo.tone);
  const letters = logo.monogram.slice(0, 3).toUpperCase();
  const fontSize = letters.length >= 3 ? 13.5 : letters.length === 2 ? 16 : 19;

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      role="img"
      aria-label={`${letters} monogram`}
      className={cn("shrink-0", className)}
      {...props}
    >
      <rect x="0" y="0" width="40" height="40" fill={`var(--tone-${tone})`} />
      <rect
        x="2.5"
        y="2.5"
        width="35"
        height="35"
        fill="none"
        stroke={`var(--tone-${tone}-deep)`}
        strokeOpacity="0.45"
        strokeWidth="1"
      />
      <text
        x="20"
        y="20"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-sans)"
        fontWeight="600"
        fontSize={fontSize}
        letterSpacing="0.04em"
        fill={`var(--tone-${tone}-deep)`}
      >
        {letters}
      </text>
    </svg>
  );
}
