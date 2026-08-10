"use client";

/**
 * The filing counter — posting to the floor.
 *
 * Two modes: a need (a brief — what the company is looking for) and a product
 * (an offer that references one of the company's own articles, so it carries
 * the drawn swatch). Both address an audience among the five company types,
 * chosen by striking the same station geometry the address rail prints on
 * every notice: the instrument that writes the address is the instrument
 * that reads it.
 *
 * The form borrows the register row's own anatomy: on large screens the
 * audience instrument stands in the same right-hand column — same width,
 * same rule — where the address rail prints on every posted notice below.
 * You write the address exactly where it will appear.
 *
 * Brands own no products in this data set — that is real, and the product
 * mode says so instead of hiding.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Fragment, useEffect, useId, useRef, useState, useTransition } from "react";

import { StationTick, describeAudience, pluralTypeLabel } from "@/components/arena/address-rail";
import { MaterialSwatch } from "@/components/arena/material-swatch";
import { Monogram } from "@/components/arena/monogram";
import { todayIso } from "@/components/arena/registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { postNotice } from "@/lib/api";
import {
  COMPANY_TYPE_ORDER,
  type Company,
  type CompanyType,
  type NoticeKind,
  type Product,
} from "@/lib/types";
import { cn } from "@/lib/utils";

/** Field labels are labels of record — the catalogue's mono-caps voice. */
const FIELD_LABEL = "arena-data font-normal text-muted-foreground";

export function FloorComposer({
  author,
  products,
}: {
  author: Company;
  /** The acting company's own products — the only articles it may offer. */
  products: Product[];
}) {
  const router = useRouter();
  const uid = useId();
  const [pending, startTransition] = useTransition();

  const [mode, setMode] = useState<NoticeKind | null>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [region, setRegion] = useState("");
  const [skillsRaw, setSkillsRaw] = useState("");
  const [deadline, setDeadline] = useState("");
  const [productId, setProductId] = useState("");
  const [audience, setAudience] = useState<CompanyType[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [filed, setFiled] = useState<string | null>(null);

  const titleRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    if (mode) titleRef.current?.focus();
  }, [mode]);

  const chosenProduct = products.find((product) => product.id === productId) ?? null;
  const canOffer = products.length > 0;

  const toggleType = (type: CompanyType) => {
    setAudience((current) =>
      current.includes(type)
        ? current.filter((entry) => entry !== type)
        : [...current, type]
    );
  };

  const openMode = (next: NoticeKind) => {
    setMode(next);
    setFiled(null);
    setError(null);
  };

  const submit = () => {
    const cleanTitle = title.trim();
    if (!cleanTitle) {
      setError("The notice needs a title — that line is what the floor reads first.");
      titleRef.current?.focus();
      return;
    }
    if (mode === "offer" && !chosenProduct) {
      setError("Choose which of your products the offer puts forward.");
      return;
    }
    setError(null);

    startTransition(async () => {
      try {
        await postNotice({
          author_id: author.id,
          kind: mode as NoticeKind,
          title: cleanTitle,
          body: body.trim() || undefined,
          addressed_to: audience,
          sector: author.sector,
          region: mode === "need" ? region.trim() || null : null,
          skills:
            mode === "need"
              ? skillsRaw
                  .split(",")
                  .map((entry) => entry.trim())
                  .filter(Boolean)
              : [],
          deadline: mode === "need" ? deadline || null : null,
          product_id: mode === "offer" ? chosenProduct?.id ?? null : null,
        });
        setMode(null);
        setFiled(cleanTitle);
        setTitle("");
        setBody("");
        setRegion("");
        setSkillsRaw("");
        setDeadline("");
        setProductId("");
        setAudience([]);
        router.refresh();
      } catch (cause: unknown) {
        setError(
          cause instanceof Error ? cause.message : "The notice could not be posted"
        );
      }
    });
  };

  /* ------------------------------ collapsed ------------------------------ */

  if (!mode) {
    return (
      <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-3">
          {/* Same plate size as the register rows below — the counter head
              lines up with the entries it produces. */}
          <Monogram logo={author.logo} size={40} />
          <div className="min-w-0 flex-1">
            <p className="text-base leading-snug font-medium">
              Post to the floor as {author.name}
            </p>
            <p className="mt-0.5 text-[13px] text-muted-foreground">
              A need or a product, addressed to the company types that can answer it.
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={() => openMode("need")}>
              Post a need
            </Button>
            <Button type="button" variant="outline" onClick={() => openMode("offer")}>
              Offer a product
            </Button>
          </div>
        </div>
        <div role="status">
          {filed && (
            <p className="mt-3.5 flex items-start gap-2.5 border-t pt-3.5 text-sm leading-relaxed duration-200 animate-in fade-in">
              {/* The struck station: the slip is on the floor. */}
              <StationTick struck className="mt-1.5" />
              <span>
                <span className="font-medium">Filed.</span>{" "}
                <span className="text-muted-foreground">
                  “{filed}” is on the floor, first in your register below.
                </span>
              </span>
            </p>
          )}
        </div>
      </div>
    );
  }

  /* ------------------------------- expanded ------------------------------- */

  const modes: { kind: NoticeKind; label: string }[] = [
    { kind: "need", label: "Post a need" },
    { kind: "offer", label: "Offer a product" },
  ];

  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 duration-200 ease-out animate-in fade-in slide-in-from-top-2 sm:p-5">
      {/* The mode row closes with a rule; the active tab strikes it in Signal. */}
      <div className="flex items-end justify-between gap-4 border-b">
        <div role="tablist" aria-label="Notice kind" className="-mb-px flex gap-6">
          {modes.map((entry) => {
            const selected = entry.kind === mode;
            const other: NoticeKind = entry.kind === "need" ? "offer" : "need";
            return (
              <button
                key={entry.kind}
                type="button"
                role="tab"
                id={`${uid}-tab-${entry.kind}`}
                aria-selected={selected}
                aria-controls={`${uid}-panel`}
                tabIndex={selected ? 0 : -1}
                onClick={() => openMode(entry.kind)}
                onKeyDown={(event) => {
                  if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") return;
                  event.preventDefault();
                  openMode(other);
                  document.getElementById(`${uid}-tab-${other}`)?.focus();
                }}
                className={cn(
                  "relative cursor-pointer pb-2.5 text-sm font-medium transition-colors outline-none",
                  "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                  selected
                    ? "text-foreground after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:bg-primary"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {entry.label}
              </button>
            );
          })}
        </div>
        <p className="arena-data hidden pb-2.5 text-muted-foreground sm:block">
          Posting as {author.name}
        </p>
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${mode}`}>
        {mode === "offer" && !canOffer ? (
          /* Honest unavailability: brands buy, they do not sell components. */
          <div className="pt-4">
            <p className="text-sm font-medium">
              {author.name} owns no products in this register.
            </p>
            <p className="mt-1 max-w-xl text-sm text-muted-foreground">
              An offer must put forward one of your own articles, and brands buy —
              they do not sell components. Post a need instead, or read your{" "}
              <Link
                href={`/companies/${author.id}`}
                className="underline underline-offset-4 hover:text-primary"
              >
                company record
              </Link>
              .
            </p>
            <div className="mt-4 flex gap-2">
              <Button type="button" variant="outline" onClick={() => openMode("need")}>
                Post a need
              </Button>
              <Button type="button" variant="ghost" onClick={() => setMode(null)}>
                Close
              </Button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {/* The register row's own grid: content left, the address column
                right — same 230px, same rule as every posted notice below. */}
            <div className="grid gap-x-10 gap-y-5 pt-4 lg:grid-cols-[minmax(0,1fr)_230px]">
              <div className="space-y-4">
                {mode === "offer" && (
                  <div className="max-w-xl space-y-2">
                    <Label htmlFor={`${uid}-product`} className={FIELD_LABEL}>
                      Product
                    </Label>
                    <Select value={productId} onValueChange={setProductId}>
                      <SelectTrigger id={`${uid}-product`} className="w-full">
                        <SelectValue placeholder="Choose from your register" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} — {product.category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {chosenProduct && (
                      /* Drawn as it will print — the row's evidence block. */
                      <div className="flex items-center gap-3 pt-1">
                        <div className="h-14 w-[74px] shrink-0">
                          <MaterialSwatch visual={chosenProduct.visual} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-medium">{chosenProduct.name}</p>
                          <p className="arena-data mt-0.5 text-muted-foreground">
                            {chosenProduct.material} · MOQ {chosenProduct.moq} · Lead{" "}
                            {chosenProduct.lead_time}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="max-w-xl space-y-2">
                  <Label htmlFor={`${uid}-title`} className={FIELD_LABEL}>
                    Title <span aria-hidden="true">*</span>
                    <span className="sr-only">(required)</span>
                  </Label>
                  <Input
                    ref={titleRef}
                    id={`${uid}-title`}
                    value={title}
                    onChange={(event) => setTitle(event.target.value)}
                    placeholder={
                      mode === "need"
                        ? "What you are looking for, in one line"
                        : "What you are putting forward, in one line"
                    }
                    maxLength={120}
                  />
                </div>

                <div className="max-w-xl space-y-2">
                  <Label htmlFor={`${uid}-body`} className={FIELD_LABEL}>
                    Details
                  </Label>
                  <Textarea
                    id={`${uid}-body`}
                    value={body}
                    onChange={(event) => setBody(event.target.value)}
                    rows={3}
                    placeholder="Quantities, timing, terms — what a counterparty needs to answer."
                    className="resize-none bg-transparent"
                  />
                </div>

                {mode === "need" && (
                  <div className="grid max-w-xl gap-4 sm:grid-cols-3">
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor={`${uid}-region`} className={FIELD_LABEL}>
                        Region
                      </Label>
                      <Input
                        id={`${uid}-region`}
                        value={region}
                        onChange={(event) => setRegion(event.target.value)}
                        placeholder="Any region"
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor={`${uid}-deadline`} className={FIELD_LABEL}>
                        Closes
                      </Label>
                      <Input
                        id={`${uid}-deadline`}
                        type="date"
                        min={todayIso()}
                        value={deadline}
                        onChange={(event) => setDeadline(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2 sm:col-span-1">
                      <Label htmlFor={`${uid}-skills`} className={FIELD_LABEL}>
                        Capabilities sought
                      </Label>
                      <Input
                        id={`${uid}-skills`}
                        value={skillsRaw}
                        onChange={(event) => setSkillsRaw(event.target.value)}
                        placeholder="Comma-separated"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* The address column — the checklist runs the chain top to
                  bottom, upstream to downstream, joined by the rail's own
                  hairline connectors turned vertical. */}
              <fieldset className="min-w-0 lg:border-l lg:pl-6">
                <legend className="arena-data text-muted-foreground">
                  Addressed to
                </legend>
                <p className="mt-1.5 text-[13px] leading-relaxed text-muted-foreground">
                  Strike the company types this notice speaks to. None struck leaves
                  it open to every type.
                </p>
                <div className="mt-3 max-w-60">
                  {COMPANY_TYPE_ORDER.map((type, index) => {
                    const on = audience.includes(type);
                    return (
                      <Fragment key={type}>
                        {index > 0 && (
                          <span
                            aria-hidden="true"
                            className="ml-[12.5px] block h-2 w-px bg-border"
                          />
                        )}
                        <button
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleType(type)}
                          className={cn(
                            "flex h-8 w-full cursor-pointer items-center gap-2.5 rounded-md px-2 text-left text-[13px] transition-colors outline-none",
                            "hover:bg-muted/50 focus-visible:ring-[3px] focus-visible:ring-ring/50",
                            on
                              ? "font-medium text-foreground"
                              : "text-muted-foreground hover:text-foreground"
                          )}
                        >
                          <span className="flex w-2.5 shrink-0 justify-center">
                            <StationTick struck={on} />
                          </span>
                          {pluralTypeLabel(type)}
                        </button>
                      </Fragment>
                    );
                  })}
                </div>
                {/* The compiled address, printed as the rail prints it. */}
                <p className="arena-data mt-3 text-muted-foreground">
                  To <span className="text-foreground">{describeAudience(audience)}</span>
                </p>
              </fieldset>
            </div>

            <div role="status">
              {error && (
                <p className="mt-4 text-[13px] leading-relaxed text-destructive">
                  {error}
                </p>
              )}
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 border-t pt-4">
              <Button type="submit" disabled={pending}>
                {pending ? "Posting…" : "Post to the floor"}
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setMode(null);
                  setError(null);
                }}
              >
                Cancel
              </Button>
              <p className="arena-data ml-auto text-muted-foreground">
                Notices reset when the prototype restarts
              </p>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
