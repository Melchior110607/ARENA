import { cn } from "@/lib/utils";

/**
 * The specification register shared by the company profile and the product
 * record: mono labels of record on the left, values on the right, hairline
 * rules between rows, a heavier rule opening the sheet — the DIN spec-table
 * idiom, not a soup of pills.
 *
 * Values arrive as ReactNodes so pages can set measurements in mono, lists
 * as plain separated text, and certifications as outline chips.
 */

export interface SpecRow {
  label: string;
  value: React.ReactNode;
}

export function SpecSheet({ rows, className }: { rows: SpecRow[]; className?: string }) {
  return (
    <dl className={cn("border-t border-foreground/25", className)}>
      {rows.map((row) => (
        <div
          key={row.label}
          className="grid grid-cols-[7.5rem_minmax(0,1fr)] gap-x-4 border-b py-2.5 sm:grid-cols-[13rem_minmax(0,1fr)] sm:gap-x-6"
        >
          <dt className="arena-data pt-0.5 text-muted-foreground">{row.label}</dt>
          <dd className="text-sm">{row.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** A measured value — Fragment Mono is the sound of measurement. */
export function SpecValue({ children }: { children: React.ReactNode }) {
  return <span className="font-mono text-[13px]">{children}</span>;
}

/** A list value: plain interpunct-separated text, or an em dash when empty. */
export function specList(items: string[]): React.ReactNode {
  return items.length > 0 ? items.join(" · ") : <span className="text-muted-foreground">—</span>;
}
