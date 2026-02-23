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

function PrimaryButton(props: { href: string; label: string; newTab?: boolean }) {
  return (
    <a
      href={props.href}
      target={props.newTab ? "_blank" : undefined}
      rel={props.newTab ? "noopener noreferrer" : undefined}
      className="inline-flex items-center justify-center rounded-xl bg-sky-400 px-5 py-3 text-sm font-semibold text-slate-950 shadow-sm hover:bg-sky-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-300"
    >
      {props.label}
    </a>
  );
}

function SecondaryButton(props: { href: string; label: string; newTab?: boolean }) {
  return (
    <a
      href={props.href}
      target={props.newTab ? "_blank" : undefined}
      rel={props.newTab ? "noopener noreferrer" : undefined}
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
      { href: "#format", label: "Format" },
      { href: "#schedule", label: "Dates" },
      { href: "#pricing", label: "Pricing" },
      { href: "#faq", label: "FAQ" },
    ],
    []
  );

  const sectionIds = nav.map((n) => n.href.replace(/^#/, ""));
  const active = useActiveHash(sectionIds);

  const faqs: Faq[] = [
    {
      q: "Can I drop my child off?",
      a: "No—this is designed for parent + child together. We want families to leave with shared language and a shared family plan you can use at home.",
    },
    {
      q: "Do kids need their own device or accounts?",
      a: "No. We keep screens minimal and do not require kid accounts. Any screen use is presenter-controlled.",
    },
    {
      q: "What ages work best?",
      a: "Designed for elementary-aged families (best for ages ~7–10). Parents can adapt the same ideas for older siblings too.",
    },
    {
      q: "What if we miss a week?",
      a: "If you miss a session, we’ll do our best to share the take-home materials. The backup date (Mar 29, 2026) is intended in case a class needs to be rescheduled—not as an extra catch-up day.",
    },
    {
      q: "What’s your refund / cancellation policy?",
      a: "If your plans change, email us at hi@chipgpt.biz and we’ll work with you. If we need to cancel or reschedule a session, you’ll have the option of a refund or transferring your registration.",
    },
    {
      q: "Can I take photos?",
      a: "You’re welcome to take photos of your own family, but please don’t photograph other families without their permission. If we want to take any photos for promotion, we’ll ask for consent first.",
    },
    {
      q: "Is this a coding class?",
      a: "No. It’s foundational tech literacy—systems, interfaces, automation, data basics, and calm decision-making around tools.",
    },
  ];

  return (
    <div id="top" className="min-h-dvh bg-slate-950 text-white">
      <a
        href="#what"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-lg focus:bg-white focus:px-3 focus:py-2 focus:text-slate-900"
      >
        Skip to content
      </a>

      {/* Top nav */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-slate-950/70 backdrop-blur">
        <Container className="flex h-16 items-center justify-between">
          <a href="#top" className="flex items-center gap-3 rounded-lg focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/40">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-400/15 ring-1 ring-sky-400/30">
              <span className="text-sm font-bold text-sky-200" aria-hidden>
                TL
              </span>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold">Family Tech Literacy Workshop</p>
              {/* (Removed: area tagline) */}
            </div>
          </a>

          <nav aria-label="Page" className="hidden items-center gap-1 lg:flex">
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
            <PrimaryButton href="#register" label="Register now" />
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
              Register now
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
                  Raise tech-literate kids—so your family can stay in control.
                </h1>
                <p className="mt-4 text-base leading-relaxed text-white/80 sm:text-lg">
                  Helping families understand how technology shapes attention, choices, and values.
                </p>

                {/* #2: fast decision info */}
                <p className="mt-4 text-sm text-white/70">
                  Sundays in March 2026 • 2:00–3:15pm • $149 first child + $100 sibling
                </p>

                <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
                  <PrimaryButton href="#register" label="Register now" />
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
                  alt="Family tech values plan on the fridge"
                  className="h-auto w-full"
                  loading="lazy"
                />
                <figcaption className="px-4 py-3 text-sm text-white/70">
                  <span className="font-semibold text-white">Make it practical.</span> A fridge-friendly tech values plan your family actually uses.
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
                  <span className="font-semibold text-white">Make it calm.</span> Simple defaults and boundaries that reduce friction.
                </figcaption>
              </figure>
            </div>
          </Container>
        </section>

        <Section id="what" eyebrow="Overview" title="What it is">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card title="A 4-week series">
              Four sessions designed to build foundations—not random tips. You’ll leave with shared vocabulary about technology and a written family tech plan you can use at home.
            </Card>
            <Card title="Values-first (not fear-first)">
              We focus on calm, practical choices: what job a tool is doing, whether it’s doing that job
              well, and what boundaries keep your home healthy.
            </Card>
          </div>
        </Section>

        <Section id="who" eyebrow="Audience" title="Who it’s for">
          <div className="grid gap-4 sm:grid-cols-3">
            <Card title="Elementary-aged kids (best for ages ~7–10)">
              Activities are hands-on and age-appropriate. Older kids get optional “stretch” prompts.
            </Card>
            <Card title="Parents (required)">
              The goal is a shared family vocabulary and playbook you can use together.
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
                <li>Technology is a tool made by people to do a job.</li>
                <li>Systems turn inputs into outputs by following rules.</li>
                <li>Automation is a system on repeat (like autoplay).</li>
                <li>Accounts help apps remember you; settings and defaults help you stay in control (data + privacy).</li>
                <li>User interfaces use patterns—some help, some pull (attention traps).</li>
                <li>Boundaries and defaults help families stay in control.</li>
              </ul>
            </Card>
            <Card title="Take-home outcomes">
              <ul className="mt-2 list-disc space-y-2 pl-5">
                <li>A Family Tech Values Plan (fridge-friendly).</li>
                <li>An Automation Plan (one to add, one to turn off).</li>
                <li>An Account + Privacy Plan (data, settings, defaults).</li>
                <li>A Boundary Plan (time/place/content/friction).</li>
                <li>A combined Final Family Tech Plan.</li>
              </ul>
            </Card>
          </div>
        </Section>

        {/* #4: week-by-week */}
        <Section id="weeks" eyebrow="4 sessions" title="Week-by-week">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card title="Week 1: Tools made by people">
              Tech is a tool with a job. Build your Family Tech Values Plan.
            </Card>
            <Card title="Week 2: Systems & automation">
              How "smart" can be simple. Spot inputs → rules → outputs.
            </Card>
            <Card title="Week 3: Data & accounts">
              Kid-safe basics on data, accounts, privacy, and why default settings matter.
            </Card>
            <Card title="Week 4: User Interfaces & patterns">
              Learn UI handles + patterns (some help, some pull) and build boundaries that stick.
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
            <Card title="Calm and practical">
              No scare talk. No guilt. No screen shaming—just clear explanations and hands-on activities.
            </Card>
            <Card title="Small group">
              Interactive, discussion-based sessions so kids stay engaged and families leave with a real plan.
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
              <p className="mt-2 text-white/70">
                We’re booking a family-friendly venue with easy parking. Final address will be emailed to registered families.
              </p>
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
                  newTab
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
                  newTab
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
                  newTab
                />
              </div>
            </Card>
            {/* Removed “What’s included” box */}
          </div>

          <p className="mt-4 text-sm text-white/60">
            After you register, you’ll get an email confirmation. The venue address will be sent once finalized.
          </p>

          <p className="mt-4 text-sm text-white/70">
            Questions about registration? Email{" "}
            <a className="font-semibold text-sky-300 hover:text-sky-200" href="mailto:hi@chipgpt.biz">
              hi@chipgpt.biz
            </a>
            .
          </p>
        </Section>

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
            </div>
            <div className="max-w-2xl text-white/80">
              <p className="text-base">
                This workshop is built to be <span className="font-semibold text-white">calm, practical, and real</span>—the kind of tech
                literacy that holds up when you’re tired, your kid is melting down, and you still need a simple way
                to make decisions.
              </p>
              <p className="mt-3 text-base">
                I’m Chip Armstrong. I’ve spent <span className="font-semibold text-white">15+ years</span> building software products and
                systems used by thousands of people.
                I also built and scaled a SaaS platform that was <span className="font-semibold text-white">acquired</span>.
              </p>
              <p className="mt-3 text-base">
                At home, I’m a dad of young kids. That’s why this program is
                intentionally low-screen and family-first: you leave with a few defaults and scripts you can actually
                use, not a bunch of guilt or theory.
              </p>
              {/* (Removed: redundant summary paragraph) */}
              <p className="mt-4 text-sm">
                Questions? Email <a className="font-semibold text-sky-300 hover:text-sky-200" href="mailto:hi@chipgpt.biz">hi@chipgpt.biz</a>
              </p>
            </div>
          </div>
        </Section>

        <Section id="faq" eyebrow="Good questions" title="FAQ">
          <div className="grid gap-3">
            {faqs.map((f) => (
              <FAQItem key={f.q} item={f} />
            ))}
          </div>
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
              procedures.
            </Card>
          </div>
        </Section>

        <section id="register" className="scroll-mt-24 py-16">
          <Container>
            <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/0 p-8 shadow-sm sm:p-10">
              <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr] md:items-center">
                <div>
                  <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">Ready to register?</h2>
                  <p className="mt-3 text-white/80">
                    Pick the option that matches the number of kids you’re registering. (This covers all 4 weeks.)
                  </p>
                  <p className="mt-2 text-sm text-white/60">
                    After you register, you’ll get an email confirmation. The venue address will be sent once finalized.
                  </p>
                </div>
                <div className="flex flex-col gap-3">
                  <PrimaryButton
                    href="https://book.stripe.com/5kQ6oJgGF4NY3hj3EX43S00"
                    label="Register: 1 child"
                    newTab
                  />
                  <PrimaryButton
                    href="https://book.stripe.com/6oU3cxgGFgwG7xz3EX43S01"
                    label="Register: 2 children"
                    newTab
                  />
                  <PrimaryButton
                    href="https://book.stripe.com/5kQ3cx0HHgwG4ln2AT43S02"
                    label="Register: 3 children"
                    newTab
                  />
                  <SecondaryButton href="mailto:hi@chipgpt.biz" label="Questions? Email hi@chipgpt.biz" />
                </div>
              </div>
            </div>

            <footer className="mt-10 border-t border-white/10 pt-6 text-sm text-white/60">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p>© {new Date().getFullYear()} Chip Armstrong</p>
                <p className="text-white/50">Family Tech Literacy Workshop</p>
              </div>
            </footer>
          </Container>
        </section>
          </div>
      </main>
    </div>
  );
}
