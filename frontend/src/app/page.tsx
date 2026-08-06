import { PublicLanding } from "@/components/arena/public-landing";
import { getCompanies, getFeed } from "@/lib/api";
import { getPersonaId } from "@/lib/persona.server";
import { isVisitor } from "@/lib/persona";

export const dynamic = "force-dynamic";

/**
 * The root does one of two things.
 *
 * Signed out, it is the public page — what a company sees before joining, and
 * the argument for joining. Signed in, it is the floor: the notices its
 * connections have posted, then the ones addressed to its kind of company.
 *
 * PLACEHOLDER: the signed-in branch below is scaffolding. The floor, the notice
 * card and the composer are the design agent's work.
 */
export default async function RootPage() {
  const personaId = await getPersonaId();

  if (isVisitor(personaId)) return <PublicLanding />;

  const [feed, companies] = await Promise.all([getFeed(personaId), getCompanies()]);
  const nameOf = new Map(companies.map((company) => [company.id, company.name]));

  const sections = [
    { key: "from_connections", label: "From your connections", items: feed.from_connections },
    { key: "for_you", label: "For you", items: feed.for_you },
  ] as const;

  return (
    <div className="space-y-10">
      <h1 className="text-2xl font-semibold tracking-tight">The Floor</h1>

      {sections.map((section) => (
        <section key={section.key} className="space-y-4">
          <h2 className="font-medium">
            {section.label}{" "}
            <span className="text-muted-foreground">({section.items.length})</span>
          </h2>
          <ul className="space-y-6">
            {section.items.map((notice) => (
              <li key={notice.id} className="border-b pb-4">
                <p className="text-sm text-muted-foreground">
                  {nameOf.get(notice.author_id) ?? notice.author_id} · {notice.kind} ·{" "}
                  {notice.posted_at}
                </p>
                <p className="font-medium">{notice.title}</p>
                <p className="max-w-2xl text-sm">{notice.body}</p>
                <p className="text-sm text-muted-foreground">
                  Addressed to:{" "}
                  {notice.addressed_to.length > 0
                    ? notice.addressed_to.join(", ")
                    : "everyone"}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
