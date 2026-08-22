import Link from "next/link";
import { Button } from "@/components/ui/button";
import { VaultMark } from "@/components/layout/header";
import {
  ArrowRight,
  Lock,
  Scale,
  ShieldCheck,
  Radio,
  Check,
  Github,
  ChevronDown,
  Heart,
} from "lucide-react";

const FEATURES = [
  {
    icon: Lock,
    title: "Milestone escrow",
    body: "Clients fund one milestone at a time. Funds sit in the contract — not in a middleman's account — until work is approved.",
  },
  {
    icon: Scale,
    title: "Dispute arbitration",
    body: "Either side can flag a milestone. An on-chain arbitrator reviews it and releases funds to whoever the work supports.",
  },
  {
    icon: ShieldCheck,
    title: "On-chain reputation",
    body: "Every completed milestone — and every lost dispute — updates a freelancer's score. No database, impossible to fake.",
  },
  {
    icon: Radio,
    title: "Real-time activity",
    body: "Every gig post, funding, submission, and resolution streams into a live feed pulled directly from contract events.",
  },
];

const FAQS = [
  {
    q: "What is GigVault?",
    a: "GigVault is a freelance marketplace on Stellar where payments are held in a smart contract escrow. Clients fund work milestone by milestone, and funds only release when the work is approved — or when an on-chain arbitrator resolves a dispute.",
  },
  {
    q: "How do I get paid for completed work?",
    a: "Accept a gig, deliver a milestone, and hit Submit. The moment the client approves it, the smart contract transfers the escrowed XLM straight to your wallet — no invoices, no 30-day payment terms, no platform holding your money.",
  },
  {
    q: "What happens if the client and freelancer disagree?",
    a: "Either side can raise a dispute on a funded milestone. The freelancer can rework and resubmit the delivery, or a designated arbitrator reviews the case on-chain and releases the escrow to whoever the work supports.",
  },
  {
    q: "How does reputation work?",
    a: "Every address has an on-chain score from 0 to 1000, starting at a neutral 500. Completed milestones add +25, winning a dispute adds +10, and losing one costs −40. It's computed by the contract itself, so it can't be edited or faked.",
  },
  {
    q: "What payment methods does GigVault support?",
    a: "GigVault currently escrows XLM (Stellar's native asset) on testnet via the Stellar Asset Contract. The same contract works with any Stellar asset — like USDC — by pointing it at a different asset contract at deploy time.",
  },
];

export default function HomePage() {
  return (
    <div>
      {/* ------------------------------------------------------------ hero */}
      <section className="container relative flex flex-col items-center gap-6 pb-16 pt-24 text-center">
        <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-xs font-medium text-muted-foreground">
          <span className="h-1 w-1 rounded-full bg-foreground/40" />
          Introducing GigVault
          <span className="h-1 w-1 rounded-full bg-foreground/40" />
        </span>

        <div className="relative">
          <Sparkle className="absolute -left-10 top-2 h-5 w-5 -rotate-12" />
          <Sparkle className="absolute -right-8 -top-4 h-4 w-4 rotate-12" />
          <Sparkle className="absolute -bottom-2 right-24 h-3 w-3 rotate-45 opacity-60" />
          <h1 className="max-w-3xl text-balance text-5xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl md:text-7xl">
            Find Talent, Fund Work
          </h1>
        </div>

        <p className="max-w-xl text-balance text-lg text-muted-foreground">
          Whether you&apos;re searching for your next gig or hiring skilled people, GigVault locks
          every payment in escrow and releases it milestone by milestone.
        </p>

        <Link href="/app">
          <Button size="lg" className="h-12 rounded-xl px-8 text-base font-semibold shadow-md shadow-primary/30">
            Get Started For Free
          </Button>
        </Link>

        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          powered by <StellarWordmark />
        </p>
      </section>

      {/* ----------------------------------------------------- app preview */}
      <section className="container pb-24">
        <div className="relative mx-auto max-w-4xl">
          <div className="absolute -top-2 left-1/2 h-4 w-[92%] -translate-x-1/2 rounded-t-2xl bg-surface-raised" />
          <div className="relative overflow-hidden rounded-2xl border border-border bg-card shadow-xl shadow-black/5">
            {/* preview chrome */}
            <div className="flex items-center justify-between border-b border-border px-5 py-3">
              <div className="flex items-center gap-2">
                <VaultMark className="h-7 w-7 rounded-lg [&_svg]:h-4 [&_svg]:w-4" />
                <span className="text-sm font-extrabold tracking-tight">GigVault</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-md border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground sm:block">
                  Network: Testnet
                </span>
                <span className="rounded-md border border-border px-2.5 py-1 font-mono text-xs">
                  GAM3K…LXKC
                </span>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-[180px_1fr]">
              {/* balance rail */}
              <div className="hidden flex-col justify-between border-r border-border p-5 md:flex">
                <div>
                  <p className="text-xs text-muted-foreground">Escrowed</p>
                  <p className="mt-1 text-2xl font-extrabold font-tabular">12,500 XLM</p>
                </div>
                <div className="space-y-1.5 text-xs text-muted-foreground">
                  <p className="font-semibold text-foreground">3 gigs in progress</p>
                  <p>2 milestones awaiting review</p>
                </div>
              </div>

              {/* gig list mock */}
              <div className="p-5">
                <div className="mb-4 flex items-center gap-4 border-b border-border text-sm">
                  <span className="border-b-2 border-foreground pb-2 font-semibold">Looking For Work</span>
                  <span className="pb-2 text-muted-foreground">Looking To Hire</span>
                </div>

                <PreviewGig
                  title="Design a landing page"
                  skill="design"
                  amount="400 XLM"
                  seals={[2, 1, 0]}
                  action="Submit delivery"
                />
                <PreviewGig
                  title="Audit a Soroban contract"
                  skill="security"
                  amount="1,200 XLM"
                  seals={[2, 2, 1]}
                  action="Approve & release"
                  dark
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- features */}
      <section id="about" className="border-t border-border bg-surface/60 py-24">
        <div className="container">
          <div className="mx-auto mb-12 max-w-xl text-center">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              Trust the contract, not the platform
            </h2>
            <p className="mt-3 text-muted-foreground">
              Everything that matters — money, state, reputation — lives on Stellar, confirmed in seconds.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-card p-6 transition-shadow hover:shadow-lg hover:shadow-black/5"
              >
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15">
                  <f.icon className="h-5 w-5 text-foreground" />
                </span>
                <h3 className="mt-4 font-bold">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------- how it works */}
      <section className="container py-24">
        <div className="mx-auto mb-12 max-w-xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How it works</h2>
          <p className="mt-3 text-muted-foreground">Three steps between posting a gig and money in the bank.</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Step n="01" title="Post & accept" body="A client posts a gig broken into milestones; a freelancer accepts it and the vault assigns them on-chain." />
          <Step n="02" title="Fund & deliver" body="The client escrows a milestone into the contract; the freelancer delivers and submits it for review." />
          <Step n="03" title="Release or arbitrate" body="Approval releases funds instantly to the freelancer — disagreements route to an on-chain arbitrator." />
        </div>
      </section>

      {/* ------------------------------------------------------------- faq */}
      <section id="faq" className="container max-w-3xl pb-24">
        <h2 className="mb-8 text-center text-3xl font-extrabold tracking-tight sm:text-4xl">
          Frequently asked questions
        </h2>
        <div className="divide-y divide-border border-y border-border">
          {FAQS.map((f) => (
            <details key={f.q} className="group py-2">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-3 text-left font-semibold [&::-webkit-details-marker]:hidden">
                {f.q}
                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
              </summary>
              <p className="pb-4 pr-8 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ---------------------------------------------------------- footer */}
      <footer className="container pb-10">
        <div className="rounded-3xl border border-border bg-card p-8 shadow-sm sm:p-12">
          <div className="grid gap-10 md:grid-cols-[1fr_auto_auto]">
            <div>
              <div className="flex items-center gap-2.5">
                <VaultMark />
                <span className="text-lg font-extrabold tracking-tight">GigVault</span>
              </div>
              <h3 className="mt-6 text-2xl font-extrabold tracking-tight sm:text-3xl">Join our community</h3>
              <p className="mt-2 text-muted-foreground">
                Meet like-minded people and find escrow-backed work opportunities easily.
              </p>
              <div className="mt-6 flex items-center gap-4 text-muted-foreground">
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground" aria-label="GitHub">
                  <Github className="h-5 w-5" />
                </a>
                <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="transition-colors hover:text-foreground" aria-label="X">
                  <XMark className="h-4 w-4" />
                </a>
              </div>
            </div>

            <FooterCol
              title="Quick links"
              links={[
                { label: "About", href: "#about" },
                { label: "FAQ", href: "#faq" },
                { label: "Marketplace", href: "/app" },
                { label: "Dashboard", href: "/dashboard" },
              ]}
            />
            <FooterCol
              title="Resources"
              links={[
                { label: "Stellar", href: "https://stellar.org" },
                { label: "Soroban docs", href: "https://developers.stellar.org" },
                { label: "Activity feed", href: "/activity" },
              ]}
            />
          </div>

          <p className="mt-10 flex items-center justify-end gap-1 text-xs text-muted-foreground">
            Made with <Heart className="h-3 w-3 fill-current" /> on Stellar
          </p>
        </div>
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------ helpers */

function PreviewGig({
  title,
  skill,
  amount,
  seals,
  action,
  dark,
}: {
  title: string;
  skill: string;
  amount: string;
  seals: number[]; // 0 pending · 1 active · 2 released
  action: string;
  dark?: boolean;
}) {
  return (
    <div className="mb-3 flex items-center justify-between gap-4 rounded-xl border border-border p-4 last:mb-0">
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <p className="truncate text-sm font-semibold">{title}</p>
          <span className="hidden rounded-full bg-surface px-2 py-0.5 text-[10px] font-medium capitalize text-muted-foreground sm:block">
            {skill}
          </span>
        </div>
        <div className="mt-2 flex items-center gap-1.5">
          {seals.map((s, i) => (
            <span
              key={i}
              className={
                s === 2
                  ? "flex h-5 w-5 items-center justify-center rounded-full bg-vault text-vault-foreground"
                  : s === 1
                    ? "h-5 w-5 rounded-full border-2 border-primary bg-primary/20"
                    : "h-5 w-5 rounded-full border-2 border-border"
              }
            >
              {s === 2 && <Check className="h-3 w-3" />}
            </span>
          ))}
          <span className="ml-1.5 font-mono text-xs text-muted-foreground">{amount}</span>
        </div>
      </div>
      <span
        className={
          dark
            ? "shrink-0 rounded-lg bg-vault px-3 py-1.5 text-xs font-semibold text-vault-foreground"
            : "shrink-0 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground"
        }
      >
        {action}
      </span>
    </div>
  );
}

function Step({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-vault font-mono text-xs font-bold text-vault-foreground">
        {n}
      </span>
      <h3 className="mt-4 text-lg font-bold">{title}</h3>
      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">{body}</p>
    </div>
  );
}

function FooterCol({
  title,
  links,
}: {
  title: string;
  links: { label: string; href: string }[];
}) {
  return (
    <div className="min-w-[8rem]">
      <h4 className="text-sm font-bold">{title}</h4>
      <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
        {links.map((l) => (
          <li key={l.label}>
            {l.href.startsWith("http") ? (
              <a
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="transition-colors hover:text-foreground"
              >
                {l.label}
              </a>
            ) : (
              <Link href={l.href} className="transition-colors hover:text-foreground">
                {l.label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function Sparkle({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 0l2.4 9.6L24 12l-9.6 2.4L12 24l-2.4-9.6L0 12l9.6-2.4z"
        fill="hsl(45 95% 48%)"
      />
    </svg>
  );
}

function StellarWordmark() {
  return (
    <span className="inline-flex items-center gap-1.5 font-bold tracking-wide text-foreground">
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
        <path
          d="M12 2a10 10 0 019.5 13.1l-2-.9A8 8 0 0012 4a8 8 0 00-7.9 6.7L1.6 9.6 1 11.7l21.4 9.7.6-2.1-2.5-1.1A10 10 0 0112 22 10 10 0 012.5 8.9l2 .9A8 8 0 0012 20a8 8 0 007.9-6.7l2.5 1.1.6-2.1L1.6 2.6 1 4.7l3.5 1.6"
          fill="currentColor"
          fillRule="evenodd"
        />
      </svg>
      STELLAR
    </span>
  );
}

function XMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} fill="currentColor" aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.4l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93zm-1.29 19.5h2.04L6.49 3.24H4.3z" />
    </svg>
  );
}
