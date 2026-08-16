export type LegalSection = { id: string; heading: string; body: string[] };

/** Shared template for /privacy-policy and /terms — title, effective date, TOC, prose. */
export function LegalProse({
  title,
  effectiveDate,
  draft,
  sections,
}: {
  title: string;
  effectiveDate: string;
  draft?: boolean;
  sections: LegalSection[];
}) {
  return (
    <div className="mx-auto w-full max-w-190 px-5 py-14">
      {draft && (
        <p className="mb-6 rounded-control border border-warning/50 bg-warning/10 px-4 py-2.5 text-sm text-navy">
          <strong>Draft v0.1</strong>: placeholder content pending legal review.
          Do not submit for provider verification until counsel signs off.
        </p>
      )}
      <h1 className="text-3xl font-bold tracking-tight text-navy">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted">
        Effective date: {effectiveDate}
      </p>

      <nav
        aria-label="Table of contents"
        className="mt-8 rounded-2xl border border-line bg-soft p-5"
      >
        <p className="mb-2 text-sm font-semibold text-navy">Contents</p>
        <ol className="list-decimal space-y-1 pl-5 text-sm">
          {sections.map((s) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="text-indigo-900 hover:underline">
                {s.heading}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <h2 className="text-xl font-semibold text-navy">
              {i + 1}. {s.heading}
            </h2>
            {s.body.map((p, j) => (
              <p key={j} className="mt-3 text-[15px] leading-relaxed text-ink">
                {p}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
