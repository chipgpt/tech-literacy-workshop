import { useEffect, useMemo, useState } from "react";

type NavItem = { href: string; label: string };

type Faq = { q: string; a: string };

function classNames(...xs: Array<string | false | undefined | null>) {
  return xs.filter(Boolean).join(" ");
}

function useActiveHash(ids: string[]) {
  const [active, setActive] = useState<string>(ids[0] ?? "");

  useEffect(() => {
    const onHash = () => {
      const h = (window.location.hash || "").replace(/^#/, "");
      if (h) setActive(h);
    };
    window.addEventListener("hashchange", onHash);
    onHash();
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => (b.intersectionRatio ?? 0) - (a.intersectionRatio ?? 0));
        if (visible[0]?.target?.id) setActive(visible[0].target.id);
      },
      { rootMargin: "-25% 0px -65% 0px", threshold: [0.1, 0.25, 0.5] }
    );

    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }

    return () => obs.disconnect();
  }, [ids.join("|")]);

  return active;
}

function Container(props: { children: React.ReactNode; className?: string }) {
  return (
    <div className={classNames("mx-auto w-full max-w-6xl px-4 sm:px-6", props.className)}>
      {props.children}
    </div>
  );
}

function Section(props: { id: string; title: string; eyebrow?: string; children: React.ReactNode }) {
  return (
    <section id={props.id} className="scroll-mt-24 py-14 sm:py-16">
      <Container>
        <div className="max-w-3xl">
          {props.eyebrow ? (
            <p className="text-sm font-semibold tracking-wide text-sky-300">{props.eyebrow}</p>
          ) : null}
          <h2 className="mt-2 text-2xl font-bold tracking-tight text-white sm:text-3xl">
            {props.title}
          </h2>
        </div>
        <div className="mt-6">{props.children}</div>
      </Container>
    </section>
  );
}

function Badge(props: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-white/90">
      {props.children}
    </span>
  );
}

function Card(props: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 shadow-sm">
      <h3 className="text-base font-semibold text-white">{props.title}</h3>
      <div className="mt-2 text-sm text-white/80">{props.children}</div>
    </div>
  );
}

function PrimaryButton(props: { href: string; label: string }) {
  return (
    <a
      href={props.href}
      className="inline-flex items-center justify-center rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
    >
      {props.label}
    </a>
  );
}

function SecondaryButton(props: { href: string; label: string }) {
  return (
    <a
      href={props.href}
      className="inline-flex items-center justify-center rounded-xl border border-white/15 bg-white/0 px-5 py-3 text-sm font-semibold text-white hover:bg-white/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40"
    >
      {props.label}
    </a>
  );
}

function FAQItem(props: { item: Faq }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5">
      <button
        type="button"
        className="flex w-full items-start justify-between gap-4 px-5 py-4 text-left"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="text-sm font-semibold text-white">{props.item.q}</span>
        <span className="mt-0.5 text-white/70" aria-hidden>
          {open ? "−" : "+"}
        </span>
      </button>
      {open ? (
        <div className="px-5 pb-4 text-sm text-white/80">
          <p>{props.item.a}</p>
        </div>
      ) : null}
    </div>
  );
}

export default function App() {
  const nav: NavItem[] = useMemo(
    () => [
      { href: "#what", label: "What it is" },
      { href: "#who", label: "Who it's for" },
      { href: "#learn", label: "What you'll learn" },
      { href: "#format", label: "Format" },
      { href: "#schedule", label: "Dates & time" },
      { href: "#pricing", label: "Pricing" },
      { href: "#policies", label: "Policies" },
      { href: "#faq", label: "FAQ" },
    ],
    []
  );

  const sectionIds = nav.map((n) => n.href.replace(/^#/, ""));
  const active = useActiveHash(sectionIds);

  const faqs: Faq[] = [
    {
      q: "Can I drop my child off?",
      a: "No—this is designed for parent + child together. We want families to leave with shared language and shared habits.",
    },
    {
      q: "Do kids need their own device or accounts?",
      a: "No. We keep screens minimal and do not require kid accounts. Any screen use is presenter-controlled.",
    },
    {
      q: "What ages work best?",
      a: "Designed for kids ages ~4–10. Parents can adapt the same ideas for older siblings too.",
    },
    {
      q: "What if we miss a week?",
      a: "If you miss a session, we’ll do our best to share the take-home materials. The makeup date (Mar 29, 2026) is intended as a backup in case a class needs to be rescheduled—not as an extra catch-up day.",
    },
    {
      q: "Can I take photos?",
      a: "You’re welcome to take photos of your own family, but please don’t photograph other families without their permission. If we want to take any photos for promotion, we’ll ask for consent first.",
    },
    {
      q: "Is this a coding class?",
      a: "Not exactly. It’s foundational tech literacy—systems, interfaces, automation, and calm decision-making around tools.",
    },
  ];

  return (
    <div className="min-h-dvh bg-slate-950 text-white">
      <a
        href="#what"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900"
      >
        Skip to content
      </a>

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 ring-1 ring-sky-400/30">
              <span className="text-sm font-bold text-sky-200" aria-hidden>
                TL
              </span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Family Tech Literacy Workshop</p>
              <p className="text-xs text-white/60">Rockwall / Rowlett / Forney</p>
            </div>
          </div>

          <nav aria-label="Page" className="hidden items-center gap-1 md:flex">
            {nav.map((item) => {
              const id = item.href.replace(/^#/, "");
              const isActive = active === id;
              return (
                <a
                  key={item.href}
                  href={item.href}
                  className={classNames(
                    "rounded-lg px-3 py-2 text-sm font-medium",
                    isActive ? "bg-white/10 text-white" : "text-white/70 hover:text-white hover:bg-white/5"
                  )}
                >
                  {item.label}
                </a>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <SecondaryButton href="#pricing" label="Pricing" />
            <PrimaryButton href="#register" label="Register" />
          </div>
        </Container>
      </header>

      {/* Hero */}
      <main>
        {/* #7: mobile sticky CTA */}
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-slate-950/85 p-3 backdrop-blur md:hidden">
          <Container className="flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Family Tech Literacy Workshop</p>
              <p className="truncate text-xs text-white/60">Sundays in March 2026 • 2pm</p>
            </div>
            <a
              href="#register"
              className="shrink-0 rounded-xl bg-sky-400 px-4 py-2 text-sm font-semibold text-slate-950"
            >
              Register
            </a>
          </Container>
        </div>

        {/* give room so content isn’t hidden behind the mobile bar */}
        <div className="pb-20 md:pb-0">
          <div className="relative overflow-hidden">
          <div className="pointer-events-none absolute inset-0 opacity-70">
            <div className="absolute -top-24 left-1/2 h-72 w-[44rem] -translate-x-1/2 rounded-full bg-sky-500/20 blur-3xl" />
            <div className="absolute -bottom-24 right-0 h-72 w-[44rem] translate-x-1/3 rounded-full bg-indigo-500/20 blur-3xl" />
          </div>

          <Container className="relative py-14 sm:py-20">
            <div className="grid items-center gap-10 lg:grid-cols-2">
              <div>
                <div className="flex flex-wrap gap-2">
                  <Badge>4-week series</Badge>
                  <Badge>Parent + child</Badge>
                  <Badge>Minimal screens</Badge>
                </div>

                <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl">
                  Raise tech-literate kids—without screens running the home.
                </h1>
                <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
                  Calm, hands-on tech literacy for families: tools, systems, automation, and interfaces.
                </p>

                {/* #2: fast decision info */}
                <p className="mt-4 text-sm text-white/70">
                  Sundays in March 2026 • 2:00–3:15pm • $149 first child + $100 sibling
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <PrimaryButton href="#register" label="Register" />
                  <SecondaryButton href="#schedule" label="See dates" />
                </div>

                {/* Removed hero info boxes (Where/When/Format) */}
              </div>

              <div className="hidden lg:block lg:justify-self-end">
                <figure className="overflow-hidden rounded-3xl border border-white/10 bg-white/5 shadow-sm">
                  <img
                    src="/tech-literacy-workshop/og-image.png"
                    alt="Family Tech Literacy Workshop"
                    className="h-auto w-full"
                    loading="lazy"
                  />
                </figure>
                {/* Hero image uses og-image for now */}
              </div>
            </div>
          </Container>
        </div>

        {/* Image strip */}
        <section aria-label="Workshop photos" className="py-10">
          <Container>
            <div className="grid gap-4 sm:grid-cols-3">
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img
                  src="/tech-literacy-workshop/strip-1.png"
                  alt="Family tech values card on the fridge"
                  className="h-auto w-full"
                  loading="lazy"
                />
                <figcaption className="px-4 py-3 text-sm text-white/70">
                  <span className="font-semibold text-white">Make it practical.</span> A fridge-friendly values card your family actually uses.
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img
                  src="/tech-literacy-workshop/strip-2.png"
                  alt="Sorting cards activity"
                  className="h-auto w-full"
                  loading="lazy"
                />
                <figcaption className="px-4 py-3 text-sm text-white/70">
                  <span className="font-semibold text-white">Make it hands-on.</span> Kids learn by doing—no devices required.
                </figcaption>
              </figure>
              <figure className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img
                  src="/tech-literacy-workshop/strip-3.png"
                  alt="Device parking routine at home"
                  className="h-auto w-full"
                  loading="lazy"
                />
                <figcaption className="px-4 py-3 text-sm text-white/70">
                  <span className="font-semibold text-white">Make it calm.</span> Simple defaults and routines that reduce fights.
                </figcaption>
              </figure>
            </div>
          </Container>
        </section>

        {/* Human touch: instructor */}
        <Section id="led" eyebrow="Your guide" title="Led by Chip">
          <div className="grid gap-6 md:grid-cols-[0.35fr_0.65fr] md:items-start">
            <div>
              <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                <img
                  src="/tech-literacy-workshop/placeholder-chip.svg"
                  alt="Headshot placeholder"
                  className="h-auto w-full"
                  loading="lazy"
                />
              </div>
              <p className="mt-2 text-xs text-white/55">Headshot placeholder</p>
            </div>
            <div className="max-w-2xl text-white/80">
              <p className="text-base">
                I built this workshop for families who want confidence—not conflict—around technology.
                No shame. No panic. Just a simple, repeatable way to decide what tools belong in your home.
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-5 text-sm">
                <li><span className="font-semibold text-white">Hands-on:</span> kids stay engaged without needing screens.</li>
                <li><span className="font-semibold text-white">Practical:</span> you leave with a one-page values card and defaults.</li>
                <li><span className="font-semibold text-white">Calm:</span> language that lowers the temperature in real life.</li>
              </ul>
              <p className="mt-4 text-sm">
                Questions? Email <a className="font-semibold text-sky-300 hover:text-sky-200" href="mailto:hi@chipgpt.biz">hi@chipgpt.biz</a>
              </p>
            </div>
          </div>
        </Section>

        <Section id="what" eyebrow="Overview" title="What it is">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="A 4-week series">
              Four sessions designed to build foundations—not random tips. You’ll leave with shared
              vocabulary and a simple family framework.
            </Card>
            <Card title="Values-first (not fear-first)">
              We focus on calm, practical choices: what job a tool is doing, whether it’s doing that job
              well, and what boundaries keep your home healthy.
            </Card>
          </div>
        </Section>

        <Section id="who" eyebrow="Audience" title="Who it’s for">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card title="Kids ~4–10">
              Activities are hands-on and age-appropriate. Older kids get optional “stretch” prompts.
            </Card>
            <Card title="Parents (required)">
              This is not daycare. The goal is a shared family playbook you can use all week.
            </Card>
            <Card title="Families who want balance">
              You want your kids to understand tech—without giving tech the keys to the house.
            </Card>
          </div>
        </Section>

        <Section id="learn" eyebrow="Curriculum" title="What you’ll learn">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Core ideas">
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>Technology is tools made by people for a job.</li>
                <li>Interfaces guide behavior (buttons, menus, autoplay).</li>
                <li>Systems and automation: simple steps can look “smart.”</li>
                <li>Data basics: what information tools collect and why it matters.</li>
                <li>Family rules that reduce conflict and protect attention.</li>
                <li>AI basics (kid-safe): why it can look smart, and how to use it safely.</li>
              </ul>
            </Card>
            <Card title="Take-home outcomes">
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>A one-page “Tech Values Card” for your fridge.</li>
                <li>A shared set of boundary defaults (accounts, apps, autoplay, etc.).</li>
                <li>Practical language to de-escalate screen arguments.</li>
              </ul>
            </Card>
          </div>
        </Section>

        {/* #4: week-by-week */}
        <Section id="weeks" eyebrow="4 sessions" title="Week-by-week">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Week 1: Tools made by people">
              Tech is a tool with a job. Build your Family Tech Values Card.
            </Card>
            <Card title="Week 2: Systems & automation">
              How simple steps create “smart.” Spot inputs → rules → outputs.
            </Card>
            <Card title="Week 3: Data & accounts">
              Kid-safe basics on data, logins, and why “default settings” matter.
            </Card>
            <Card title="Week 4: Interfaces & habits">
              Design choices shape behavior. Build calm boundaries that stick.
            </Card>
          </div>
        </Section>

        <Section id="format" eyebrow="How it works" title="Format rules">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Minimal screens">
              No open internet. No kid accounts required. If a screen is used, it’s presenter-controlled.
            </Card>
            <Card title="Parent + child (no drop-off)">
              Families participate together. That’s the whole point.
            </Card>
            <Card title="No lectures">
              This isn’t a scare talk or a screen-shaming session—it's practical and calm.
            </Card>
            <Card title="Small group">
              Small, interactive group so discussion stays human and kids stay engaged.
            </Card>
          </div>
        </Section>

        <Section id="schedule" eyebrow="March 2026" title="Dates & time">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Series schedule">
              <ul className="mt-2 list-disc space-y-1 pl-5">
                <li><span className="font-semibold text-white">Sundays</span> • 2:00–3:15pm</li>
                <li><span className="font-semibold text-white">4 weeks</span> • Mar 1, 8, 15, 22 (2026)</li>
              </ul>
              <p className="mt-3 text-white/70">
                Backup date: <span className="font-semibold text-white">Mar 29, 2026</span> (only if a class needs
                to be rescheduled).
              </p>
            </Card>
            <Card title="Location">
              Rockwall / Rowlett / Forney area
              <p className="mt-2 text-white/70">Final venue details will be confirmed once availability is finalized.</p>
            </Card>
          </div>
        </Section>

        <Section id="pricing" eyebrow="Paid workshop" title="Pricing">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card title="1 child">
              <p className="mt-2 text-3xl font-bold text-white">$149</p>
              <p className="mt-1 text-white/70">Includes all 4 weeks</p>
              <div className="mt-4">
                <PrimaryButton
                  href="https://book.stripe.com/5kQ6oJgGF4NY3hj3EX43S00"
                  label="Register (1 child)"
                />
              </div>
            </Card>
            <Card title="2 children">
              <p className="mt-2 text-3xl font-bold text-white">$249</p>
              <p className="mt-1 text-white/70">Includes all 4 weeks</p>
              <div className="mt-4">
                <PrimaryButton
                  href="https://book.stripe.com/6oU3cxgGFgwG7xz3EX43S01"
                  label="Register (2 children)"
                />
              </div>
            </Card>
            <Card title="3 children">
              <p className="mt-2 text-3xl font-bold text-white">$349</p>
              <p className="mt-1 text-white/70">Includes all 4 weeks</p>
              <div className="mt-4">
                <PrimaryButton
                  href="https://book.stripe.com/5kQ3cx0HHgwG4ln2AT43S02"
                  label="Register (3 children)"
                />
              </div>
            </Card>
            {/* Removed “What’s included” box */}
          </div>
          <p className="mt-4 text-sm text-white/70">
            Questions about registration? Email{" "}
            <a className="font-semibold text-sky-300 hover:text-sky-200" href="mailto:hi@chipgpt.biz">
              hi@chipgpt.biz
            </a>
            .
          </p>
        </Section>

        <Section id="policies" eyebrow="Safety" title="Policies">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="Supervision">
              Kids stay with their adult at all times. This is parent + child together (not drop-off), and the
              adult is responsible for their child’s supervision.
            </Card>
            <Card title="Screens">
              Minimal screens. No open internet. No kid accounts. If a screen is used, it’s presenter-controlled.
            </Card>
            <Card title="Photos">
              Please don’t photograph other families without their permission. If we want to take any photos for
              promotion, we’ll ask for consent first.
            </Card>
            <Card title="Safety">
              If your child needs a break, hallway breaks are always okay. In an emergency we’ll follow venue
              procedures and call 911.
              <p className="mt-2 text-white/70">
                (This workshop is educational, not medical/legal advice.)
              </p>
            </Card>
          </div>
        </Section>

        <Section id="faq" eyebrow="Good questions" title="FAQ">
          <div className="grid gap-3">
            {faqs.map((f) => (
              <FAQItem key={f.q} item={f} />
            ))}
          </div>
        </Section>

        <section id="register" className="scroll-mt-24 py-16">
          <Container>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-8 shadow-sm sm:p-10">
              <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Register</h2>
                  <p className="mt-3 text-white/80">
                    Pick the option that matches the number of kids you’re registering. (This covers all 4 weeks.)
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    Venue details will be confirmed once finalized.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <PrimaryButton
                    href="https://book.stripe.com/5kQ6oJgGF4NY3hj3EX43S00"
                    label="Register: 1 child"
                  />
                  <PrimaryButton
                    href="https://book.stripe.com/6oU3cxgGFgwG7xz3EX43S01"
                    label="Register: 2 children"
                  />
                  <PrimaryButton
                    href="https://book.stripe.com/5kQ3cx0HHgwG4ln2AT43S02"
                    label="Register: 3 children"
                  />
                  <SecondaryButton href="mailto:hi@chipgpt.biz" label="Questions? Email hi@chipgpt.biz" />
                </div>
              </div>
            </div>

            <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-white/60">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} Chip Armstrong</p>
                <p className="text-white/50">Family Tech Literacy Workshop • Rockwall / Rowlett / Forney</p>
              </div>
            </footer>
          </Container>
        </section>
          </div>
      </main>
    </div>
  );
}
