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
 * Brands own no products in this data set — that is real, and the product
 * mode says so instead of hiding.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, useTransition } from "react";

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
          <Monogram logo={author.logo} size={32} />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium">Post to the floor as {author.name}</p>
            <p className="text-[13px] text-muted-foreground">
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
            <p className="mt-3 border-t pt-3 text-sm leading-relaxed">
              <span className="font-medium">Filed.</span>{" "}
              <span className="text-muted-foreground">
                “{filed}” is on the floor, first in your register below.
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
    <div className="rounded-xl bg-card p-4 ring-1 ring-foreground/10 sm:p-5">
      <div className="flex items-center justify-between gap-4">
        <div role="tablist" aria-label="Notice kind" className="flex gap-5">
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
                  "relative cursor-pointer pb-2 text-sm font-medium transition-colors outline-none",
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
        <p className="arena-data hidden text-muted-foreground sm:block">
          Posting as {author.name}
        </p>
      </div>

      <div id={`${uid}-panel`} role="tabpanel" aria-labelledby={`${uid}-tab-${mode}`}>
        {mode === "offer" && !canOffer ? (
          /* Honest unavailability: brands buy, they do not sell components. */
          <div className="mt-4 border-t pt-4">
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
            className="mt-4 space-y-4 border-t pt-4"
            onSubmit={(event) => {
              event.preventDefault();
              submit();
            }}
          >
            {mode === "offer" && (
              <div className="max-w-xl space-y-1.5">
                <Label htmlFor={`${uid}-product`}>Product</Label>
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
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-12 w-16 shrink-0">
                      <MaterialSwatch visual={chosenProduct.visual} />
                    </div>
                    <p className="arena-data text-muted-foreground">
                      {chosenProduct.material} · MOQ {chosenProduct.moq} · Lead{" "}
                      {chosenProduct.lead_time}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="max-w-xl space-y-1.5">
              <Label htmlFor={`${uid}-title`}>
                Title <span aria-hidden="true" className="text-muted-foreground">*</span>
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

            <div className="max-w-xl space-y-1.5">
              <Label htmlFor={`${uid}-body`}>Details</Label>
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
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor={`${uid}-region`}>Region</Label>
                  <Input
                    id={`${uid}-region`}
                    value={region}
                    onChange={(event) => setRegion(event.target.value)}
                    placeholder="Any region"
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor={`${uid}-deadline`}>Closes</Label>
                  <Input
                    id={`${uid}-deadline`}
                    type="date"
                    min={todayIso()}
                    value={deadline}
                    onChange={(event) => setDeadline(event.target.value)}
                  />
                </div>
                <div className="space-y-1.5 sm:col-span-1">
                  <Label htmlFor={`${uid}-skills`}>Capabilities sought</Label>
                  <Input
                    id={`${uid}-skills`}
                    value={skillsRaw}
                    onChange={(event) => setSkillsRaw(event.target.value)}
                    placeholder="Comma-separated"
                  />
                </div>
              </div>
            )}

            <fieldset>
              <legend className="text-sm font-medium">Addressed to</legend>
              <p className="mt-0.5 text-[13px] text-muted-foreground">
                Strike the company types this notice speaks to. None struck leaves it
                open to every type.
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {COMPANY_TYPE_ORDER.map((type) => {
                  const on = audience.includes(type);
                  return (
                    <button
                      key={type}
                      type="button"
                      aria-pressed={on}
                      onClick={() => toggleType(type)}
                      className={cn(
                        "flex h-8 cursor-pointer items-center gap-2 rounded-md border px-2.5 text-[13px] transition-colors outline-none",
                        "focus-visible:ring-[3px] focus-visible:ring-ring/50",
                        on
                          ? "border-foreground/60 font-medium text-foreground"
                          : "border-border text-muted-foreground hover:border-foreground/40 hover:text-foreground"
                      )}
                    >
                      <StationTick struck={on} />
                      {pluralTypeLabel(type)}
                    </button>
                  );
                })}
              </div>
              <p className="arena-data mt-2 text-muted-foreground">
                To <span className="text-foreground">{describeAudience(audience)}</span>
              </p>
            </fieldset>

            <div className="flex flex-wrap items-center gap-3 border-t pt-4">
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
              <p className="arena-data text-muted-foreground">
                Notices reset when the prototype restarts
              </p>
            </div>
            <div role="status">
              {error && (
                <p className="text-[13px] text-destructive">{error}</p>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
