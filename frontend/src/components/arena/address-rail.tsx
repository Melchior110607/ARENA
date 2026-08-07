import { Fragment } from "react";

import { cn } from "@/lib/utils";
import {
  COMPANY_TYPE_LABELS,
  COMPANY_TYPE_ORDER,
  type CompanyType,
} from "@/lib/types";

/**
 * The address rail — the floor's signature instrument.
 *
 * Every notice declares which of the five company types it speaks to. The rail
 * draws that address the way the ChainLocator draws a chain position: five
 * station ticks in chain order (raw material producer → brand), the addressed
 * types struck solid, the rest left open. The reader's own station carries an
 * underline mark — "you stand here" — and when the notice strikes that station
 * the tick fills in Signal: the network selected this notice for your kind.
 *
 * Geometry before hue: struck = filled, open = outline, you = underlined. Those
 * three marks carry the whole reading on their own, so the line below names the
 * audience only — whether it includes the reader is left to the drawing, and
 * restated for screen readers, which cannot see it. The composer reuses the
 * identical station geometry as its input — the instrument that writes the
 * address is the instrument that reads it.
 */

/** "Processors · Manufacturers" — or "all company types" for an open notice. */
export function describeAudience(addressedTo: CompanyType[]): string {
  if (addressedTo.length === 0) return "all company types";
  return COMPANY_TYPE_ORDER.filter((type) => addressedTo.includes(type))
    .map((type) => pluralTypeLabel(type))
    .join(" · ");
}

/** "Processor" → "Processors"; "Raw material producer" → "Raw material producers". */
export function pluralTypeLabel(type: CompanyType): string {
  return `${COMPANY_TYPE_LABELS[type]}s`;
}

/**
 * Whether a notice speaks to this reader — an empty address means everyone.
 *
 * This gates registering interest: answering a call that was not made to you is
 * noise. Connecting stays open to anyone, because wanting to know a company is
 * not the same as answering its brief.
 */
export function addressesReader(
  addressedTo: CompanyType[],
  readerType: CompanyType | undefined,
): boolean {
  if (readerType === undefined) return false;
  return addressedTo.length === 0 || addressedTo.includes(readerType);
}

/** One station square — shared by the rail and the composer's audience keys. */
export function StationTick({
  struck,
  signal = false,
  className,
}: {
  struck: boolean;
  /** Reinforce "this is you" with the Signal hue. Geometry leads regardless. */
  signal?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "block shrink-0 rounded-[1px] transition-colors",
        struck
          ? cn("size-2.5", signal ? "bg-primary" : "bg-foreground")
          : "size-2 border border-input bg-transparent",
        className
      )}
    />
  );
}

export function AddressRail({
  addressedTo,
  readerType,
  className,
}: {
  addressedTo: CompanyType[];
  /** The acting company's type. Omit when signed out — no station is "you". */
  readerType?: CompanyType;
  className?: string;
}) {
  const open = addressedTo.length === 0;
  const includesReader = addressesReader(addressedTo, readerType);

  return (
    <div className={className}>
      {/* The drawing. Meaning is restated in full by the text below it. */}
      <div aria-hidden="true" className="flex items-center">
        {COMPANY_TYPE_ORDER.map((type, index) => {
          const struck = open || addressedTo.includes(type);
          const you = type === readerType;
          return (
            <Fragment key={type}>
              {index > 0 && <span className="h-px w-3 bg-border" />}
              <span
                className="flex flex-col items-center gap-0.5 px-0.5"
                title={`${pluralTypeLabel(type)}${struck ? " — addressed" : ""}${you ? " (you)" : ""}`}
              >
                <StationTick struck={struck} signal={you && includesReader} />
                {/* Reserve the marker line on every station so rows align. */}
                <span
                  className={cn(
                    "h-0.5 w-3 rounded-[1px]",
                    you ? "bg-foreground" : "bg-transparent"
                  )}
                />
              </span>
            </Fragment>
          );
        })}
      </div>

      <p className="arena-data mt-1 text-muted-foreground">
        To <span className="text-foreground">{describeAudience(addressedTo)}</span>
        {/* Whether that includes the reader is left to the rail: their station is
            underlined, and struck or open tells them the rest. Screen readers get
            it in words, since the drawing above is hidden from them. */}
        {readerType !== undefined && (
          <span className="sr-only">
            {includesReader ? " — includes you" : " — not addressed to you"}
          </span>
        )}
      </p>
    </div>
  );
}
