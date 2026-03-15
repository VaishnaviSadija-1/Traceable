"use client";

import { useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type BillingCycle = "monthly" | "annual";

interface PlanFeature {
  text: string;
}

interface PricingPlan {
  name: string;
  monthlyPrice: number | null;
  annualPrice: number | null;
  customPrice?: string;
  description: string;
  features: PlanFeature[];
  cta: string;
  ctaStyle: "primary" | "secondary";
  popular?: boolean;
}

interface ComparisonRow {
  feature: string;
  starter: string | boolean;
  growth: string | boolean;
  enterprise: string | boolean;
}

interface ComparisonCategory {
  category: string;
  rows: ComparisonRow[];
}

interface Testimonial {
  quote: string;
  name: string;
  title: string;
  company: string;
  initials: string;
}

interface FaqItem {
  question: string;
  answer: string;
}

// ── Data ─────────────────────────────────────────────────────────────────────

const plans: PricingPlan[] = [
  {
    name: "Starter",
    monthlyPrice: 299,
    annualPrice: 239,
    description: "Perfect for early-stage teams proving out pipeline from web traffic.",
    features: [
      { text: "Up to 2,500 identified visitors/mo" },
      { text: "3 team members" },
      { text: "Session tracking + IP enrichment" },
      { text: "Slack alerts" },
      { text: "30-day data retention" },
      { text: "Email support" },
    ],
    cta: "Start free trial",
    ctaStyle: "secondary",
  },
  {
    name: "Growth",
    monthlyPrice: 799,
    annualPrice: 639,
    description: "For revenue teams serious about turning anonymous traffic into closed deals.",
    features: [
      { text: "Up to 10,000 identified visitors/mo" },
      { text: "Unlimited team members" },
      { text: "Everything in Starter" },
      { text: "RB2B person-level identification" },
      { text: "Apollo enrichment (200 credits/mo)" },
      { text: "Wappalyzer tech stack data" },
      { text: "Lead scoring engine" },
      { text: "Priority support" },
    ],
    cta: "Start free trial",
    ctaStyle: "primary",
    popular: true,
  },
  {
    name: "Enterprise",
    monthlyPrice: null,
    annualPrice: null,
    customPrice: "Custom",
    description: "For high-volume orgs that need custom infrastructure, compliance, and dedicated support.",
    features: [
      { text: "Unlimited identified visitors" },
      { text: "Dedicated infrastructure" },
      { text: "Custom ICP scoring rules" },
      { text: "CRM integration (Salesforce, HubSpot)" },
      { text: "SSO / SAML authentication" },
      { text: "SLA guarantee" },
      { text: "Dedicated Customer Success Manager" },
    ],
    cta: "Talk to sales",
    ctaStyle: "secondary",
  },
];

const comparisonData: ComparisonCategory[] = [
  {
    category: "Visitor Intelligence",
    rows: [
      { feature: "Session tracking", starter: true, growth: true, enterprise: true },
      { feature: "IP-to-company lookup", starter: true, growth: true, enterprise: true },
      { feature: "Person-level identification (RB2B)", starter: false, growth: true, enterprise: true },
      { feature: "Company identification", starter: true, growth: true, enterprise: true },
    ],
  },
  {
    category: "Enrichment",
    rows: [
      { feature: "Company firmographics", starter: true, growth: true, enterprise: true },
      { feature: "Contact enrichment (Apollo)", starter: false, growth: "200 credits/mo", enterprise: "Custom" },
      { feature: "Tech stack data (Wappalyzer)", starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: "Lead Scoring",
    rows: [
      { feature: "Intent score", starter: false, growth: true, enterprise: true },
      { feature: "ICP fit score", starter: false, growth: true, enterprise: true },
      { feature: "Buyer stage detection", starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: "Alerts",
    rows: [
      { feature: "Slack alerts", starter: true, growth: true, enterprise: true },
      { feature: "Email digest", starter: true, growth: true, enterprise: true },
      { feature: "Custom alert rules", starter: false, growth: true, enterprise: true },
      { feature: "Alert deduplication", starter: false, growth: true, enterprise: true },
    ],
  },
  {
    category: "Platform",
    rows: [
      { feature: "Team members", starter: "3", growth: "Unlimited", enterprise: "Unlimited" },
      { feature: "Data retention", starter: "30 days", growth: "90 days", enterprise: "Custom" },
      { feature: "API access", starter: false, growth: true, enterprise: true },
      { feature: "SSO / SAML", starter: false, growth: false, enterprise: true },
    ],
  },
];

const faqs: FaqItem[] = [
  {
    question: "What counts as an identified visitor?",
    answer:
      "An identified visitor is any unique person or company we successfully match to a real identity — either through IP-to-company resolution or person-level identification via RB2B. Anonymous sessions that we cannot enrich do not count toward your monthly limit.",
  },
  {
    question: "Do you offer a free trial?",
    answer:
      "Yes. Every Starter and Growth plan comes with a 14-day free trial — no credit card required. You'll get full access to all features in your plan so you can see real identified visitors before committing.",
  },
  {
    question: "How does billing work?",
    answer:
      "Monthly plans are billed on the same date each month. Annual plans are billed upfront for 12 months and save you 20% compared to monthly. You can switch billing cycles at any time and the difference will be prorated.",
  },
  {
    question: "Can I upgrade or downgrade my plan?",
    answer:
      "Absolutely. You can upgrade or downgrade at any time from your account settings. Upgrades take effect immediately and you'll be charged the prorated difference. Downgrades take effect at the start of your next billing cycle.",
  },
  {
    question: "What happens if I exceed my visitor limit?",
    answer:
      "We'll send you a heads-up email at 80% usage. If you go over, we won't cut you off — instead, we'll notify you and give you the option to upgrade or purchase additional visitor credits. We never surprise-bill without consent.",
  },
  {
    question: "Is my visitor data secure?",
    answer:
      "Yes. Traceable is SOC 2 Type II compliant and all data is encrypted at rest and in transit. We do not sell visitor data to third parties. Enterprise customers can also request data residency in the US or EU.",
  },
];

const testimonials: Testimonial[] = [
  {
    quote:
      "We went from guessing who was on our site to booking demos with companies we didn't even know were interested. Traceable paid for itself in the first week.",
    name: "Marcus Webb",
    title: "VP of Sales",
    company: "Meridian Analytics",
    initials: "MW",
  },
  {
    quote:
      "The lead scoring engine alone is worth the Growth plan. Our SDRs only reach out to visitors with a score above 70 now — reply rates tripled.",
    name: "Priya Nair",
    title: "Head of Demand Gen",
    company: "Stackform",
    initials: "PN",
  },
  {
    quote:
      "Finally a tool that doesn't charge per seat. Our whole revenue org uses Traceable without worrying about license costs ballooning every time we hire.",
    name: "Jordan Castillo",
    title: "Revenue Operations Lead",
    company: "Clearpath Systems",
    initials: "JC",
  },
];

// ── Sub-components ────────────────────────────────────────────────────────────

function CheckIcon({ color = "var(--color-primary)" }: { color?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0, marginTop: "2px" }}
    >
      <circle cx="8" cy="8" r="8" fill={color} fillOpacity="0.12" />
      <path
        d="M5 8l2 2 4-4"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function XIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="8" cy="8" r="8" fill="#e5e7eb" />
      <path
        d="M5.5 5.5l5 5M10.5 5.5l-5 5"
        stroke="#9ca3af"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BillingToggle({
  cycle,
  onChange,
}: {
  cycle: BillingCycle;
  onChange: (c: BillingCycle) => void;
}) {
  return (
    <div style={styles.toggleWrapper}>
      <button
        onClick={() => onChange("monthly")}
        style={{
          ...styles.toggleOption,
          ...(cycle === "monthly" ? styles.toggleOptionActive : {}),
        }}
      >
        Monthly
      </button>
      <button
        onClick={() => onChange("annual")}
        style={{
          ...styles.toggleOption,
          ...(cycle === "annual" ? styles.toggleOptionActive : {}),
        }}
      >
        Annual
        <span style={styles.savingsBadge}>Save 20%</span>
      </button>
    </div>
  );
}

function PricingCard({
  plan,
  cycle,
}: {
  plan: PricingPlan;
  cycle: BillingCycle;
}) {
  const price = cycle === "annual" ? plan.annualPrice : plan.monthlyPrice;
  const isPopular = plan.popular;

  return (
    <div
      style={{
        ...styles.pricingCard,
        ...(isPopular ? styles.pricingCardPopular : {}),
      }}
    >
      {isPopular && (
        <div style={styles.popularBadge}>Most Popular</div>
      )}

      <div style={styles.cardHeader}>
        <h3 style={{ ...styles.planName, ...(isPopular ? { color: "var(--color-primary)" } : {}) }}>
          {plan.name}
        </h3>
        <p style={styles.planDescription}>{plan.description}</p>
      </div>

      <div style={styles.priceBlock}>
        {price !== null ? (
          <>
            <span style={styles.priceAmount}>${price}</span>
            <span style={styles.pricePeriod}>/mo</span>
            {cycle === "annual" && (
              <span style={styles.billedAnnually}>billed annually</span>
            )}
          </>
        ) : (
          <span style={styles.priceAmount}>{plan.customPrice}</span>
        )}
      </div>

      <a
        href={plan.cta === "Talk to sales" ? "/contact" : "/signup"}
        className={plan.ctaStyle === "primary" ? "btn-primary" : "btn-secondary"}
        style={{ width: "100%", justifyContent: "center", marginBottom: "28px" }}
      >
        {plan.cta}
      </a>

      <ul style={styles.featureList}>
        {plan.features.map((f, i) => (
          <li key={i} style={styles.featureItem}>
            <CheckIcon color={isPopular ? "var(--color-primary)" : "var(--color-secondary)"} />
            <span style={styles.featureText}>{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function ComparisonCell({ value }: { value: string | boolean }) {
  if (value === true) return <CheckIcon color="var(--color-primary)" />;
  if (value === false) return <XIcon />;
  return <span style={styles.cellText}>{value}</span>;
}

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div style={styles.faqList}>
      {items.map((item, i) => {
        const isOpen = openIndex === i;
        return (
          <div key={i} style={{ ...styles.faqItem, ...(isOpen ? styles.faqItemOpen : {}) }}>
            <button
              style={styles.faqQuestion}
              onClick={() => setOpenIndex(isOpen ? null : i)}
              aria-expanded={isOpen}
            >
              <span style={styles.faqQuestionText}>{item.question}</span>
              <span style={{ ...styles.faqChevron, ...(isOpen ? styles.faqChevronOpen : {}) }}>
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path
                    d="M4.5 6.75L9 11.25L13.5 6.75"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </button>
            {isOpen && (
              <div style={styles.faqAnswer}>
                <p style={{ margin: 0, color: "var(--color-text-muted)", lineHeight: 1.7 }}>
                  {item.answer}
                </p>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────

export default function PricingPage() {
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  return (
    <>
      <style>{`
        @media (max-width: 900px) {
          .pricing-grid { grid-template-columns: 1fr !important; max-width: 480px !important; margin-left: auto !important; margin-right: auto !important; }
          .comparison-table-wrapper { overflow-x: auto; }
          .comparison-table { min-width: 640px; }
          .testimonials-grid { grid-template-columns: 1fr !important; }
        }
        @media (max-width: 600px) {
          .hero-price-heading { font-size: 36px !important; }
          .hero-subtitle { font-size: 16px !important; }
          .bottom-cta-heading { font-size: 28px !important; }
        }
      `}</style>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section style={styles.hero}>
        <div className="container" style={{ textAlign: "center" }}>
          <span className="section-eyebrow">Simple Pricing</span>
          <h1
            className="hero-price-heading"
            style={styles.heroHeadline}
          >
            Invest in leads that actually convert
          </h1>
          <p
            className="hero-subtitle section-subtitle"
            style={{ ...styles.heroSubtitle, margin: "0 auto 40px" }}
          >
            No per-seat fees. No feature gates. One price for your whole team.
          </p>
          <BillingToggle cycle={cycle} onChange={setCycle} />
        </div>
      </section>

      {/* ── Pricing Grid ─────────────────────────────────────────────────── */}
      <section style={styles.pricingSection}>
        <div className="container">
          <div
            className="pricing-grid"
            style={styles.pricingGrid}
          >
            {plans.map((plan) => (
              <PricingCard key={plan.name} plan={plan} cycle={cycle} />
            ))}
          </div>
        </div>
      </section>

      {/* ── Feature Comparison Table ──────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-surface)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-eyebrow">Compare Plans</span>
            <h2 className="section-title">Everything side by side</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              A full breakdown of what's included at every tier so you can make the right call.
            </p>
          </div>

          <div className="comparison-table-wrapper">
            <table className="comparison-table" style={styles.comparisonTable}>
              <thead>
                <tr>
                  <th style={styles.thFeature}>Feature</th>
                  <th style={styles.thPlan}>Starter</th>
                  <th style={{ ...styles.thPlan, ...styles.thPopular }}>Growth</th>
                  <th style={styles.thPlan}>Enterprise</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((cat) => (
                  <>
                    <tr key={`cat-${cat.category}`}>
                      <td colSpan={4} style={styles.categoryRow}>
                        {cat.category}
                      </td>
                    </tr>
                    {cat.rows.map((row, ri) => (
                      <tr key={`${cat.category}-${ri}`} style={styles.dataRow}>
                        <td style={styles.tdFeature}>{row.feature}</td>
                        <td style={styles.tdPlan}>
                          <ComparisonCell value={row.starter} />
                        </td>
                        <td style={{ ...styles.tdPlan, ...styles.tdPopular }}>
                          <ComparisonCell value={row.growth} />
                        </td>
                        <td style={styles.tdPlan}>
                          <ComparisonCell value={row.enterprise} />
                        </td>
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Social Proof Strip ───────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-background)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-eyebrow">Customer Stories</span>
            <h2 className="section-title">Real teams, real results</h2>
          </div>
          <div
            className="testimonials-grid"
            style={styles.testimonialsGrid}
          >
            {testimonials.map((t) => (
              <div key={t.name} className="card" style={styles.testimonialCard}>
                <div style={styles.quoteIcon}>&ldquo;</div>
                <p style={styles.testimonialQuote}>{t.quote}</p>
                <div style={styles.testimonialAuthor}>
                  <div style={styles.authorAvatar}>{t.initials}</div>
                  <div>
                    <div style={styles.authorName}>{t.name}</div>
                    <div style={styles.authorMeta}>
                      {t.title} &middot; {t.company}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────── */}
      <section className="section" style={{ background: "var(--color-surface)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "56px" }}>
            <span className="section-eyebrow">FAQ</span>
            <h2 className="section-title">Questions we get a lot</h2>
            <p className="section-subtitle" style={{ margin: "0 auto" }}>
              If it's not here, our team will answer it in under an hour.
            </p>
          </div>
          <div style={styles.faqWrapper}>
            <FaqAccordion items={faqs} />
          </div>
        </div>
      </section>

      {/* ── Bottom CTA ───────────────────────────────────────────────────── */}
      <section className="section" style={styles.bottomCta}>
        <div className="container" style={{ textAlign: "center" }}>
          <h2
            className="bottom-cta-heading"
            style={styles.bottomCtaHeading}
          >
            Still have questions? Talk to us.
          </h2>
          <p style={{ ...styles.bottomCtaSubtext, margin: "0 auto 36px" }}>
            We'll walk you through the right plan for your team, show you what the data looks like on your site,
            and answer anything that's keeping you on the fence.
          </p>
          <div style={styles.bottomCtaActions}>
            <a href="/demo" className="btn-primary" style={{ fontSize: "16px", padding: "15px 32px" }}>
              Book a Demo
            </a>
            <a href="/contact" className="btn-secondary" style={{ fontSize: "16px", padding: "15px 32px" }}>
              Send us a message
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  // Hero
  hero: {
    paddingTop: "96px",
    paddingBottom: "64px",
    background: "linear-gradient(180deg, #fff9f7 0%, var(--color-background) 100%)",
    borderBottom: "1px solid var(--color-border-light)",
  },
  heroHeadline: {
    fontSize: "clamp(36px, 5vw, 56px)",
    fontWeight: 800,
    letterSpacing: "-0.03em",
    color: "var(--color-tertiary)",
    marginBottom: "20px",
    lineHeight: 1.1,
  },
  heroSubtitle: {
    fontSize: "18px",
    maxWidth: "520px",
  },

  // Toggle
  toggleWrapper: {
    display: "inline-flex",
    alignItems: "center",
    background: "var(--color-surface)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "999px",
    padding: "4px",
    gap: "4px",
  },
  toggleOption: {
    display: "inline-flex",
    alignItems: "center",
    gap: "8px",
    padding: "8px 22px",
    borderRadius: "999px",
    border: "none",
    background: "transparent",
    fontSize: "14px",
    fontWeight: 600,
    color: "var(--color-text-muted)",
    cursor: "pointer",
    transition: "all 0.18s ease",
  },
  toggleOptionActive: {
    background: "var(--color-primary)",
    color: "#fff",
  },
  savingsBadge: {
    background: "rgba(9,132,134,0.12)",
    color: "var(--color-link)",
    fontSize: "11px",
    fontWeight: 700,
    padding: "2px 8px",
    borderRadius: "999px",
    letterSpacing: "0.04em",
    textTransform: "uppercase" as const,
  },

  // Pricing section
  pricingSection: {
    paddingTop: "80px",
    paddingBottom: "96px",
    background: "var(--color-background)",
  },
  pricingGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
    alignItems: "start",
  },

  // Pricing card
  pricingCard: {
    background: "var(--color-surface)",
    border: "1.5px solid var(--color-border)",
    borderRadius: "16px",
    padding: "36px 32px",
    boxShadow: "var(--shadow-sm)",
    position: "relative" as const,
    display: "flex",
    flexDirection: "column" as const,
  },
  pricingCardPopular: {
    border: "2px solid var(--color-primary)",
    boxShadow: "0 20px 60px rgba(255,114,92,0.15), 0 8px 24px rgba(0,0,0,0.08)",
    transform: "scale(1.03)",
    zIndex: 1,
  },
  popularBadge: {
    position: "absolute" as const,
    top: "-14px",
    left: "50%",
    transform: "translateX(-50%)",
    background: "var(--color-primary)",
    color: "#fff",
    fontSize: "11px",
    fontWeight: 700,
    letterSpacing: "0.06em",
    textTransform: "uppercase" as const,
    padding: "5px 16px",
    borderRadius: "999px",
    whiteSpace: "nowrap" as const,
  },
  cardHeader: {
    marginBottom: "24px",
  },
  planName: {
    fontSize: "20px",
    fontWeight: 700,
    color: "var(--color-tertiary)",
    marginBottom: "8px",
  },
  planDescription: {
    fontSize: "14px",
    color: "var(--color-text-muted)",
    lineHeight: 1.6,
  },
  priceBlock: {
    display: "flex",
    alignItems: "baseline",
    flexWrap: "wrap" as const,
    gap: "4px",
    marginBottom: "28px",
  },
  priceAmount: {
    fontSize: "44px",
    fontWeight: 800,
    color: "var(--color-tertiary)",
    letterSpacing: "-0.03em",
    lineHeight: 1,
  },
  pricePeriod: {
    fontSize: "18px",
    color: "var(--color-text-muted)",
    fontWeight: 500,
  },
  billedAnnually: {
    width: "100%",
    fontSize: "12px",
    color: "var(--color-text-muted)",
    marginTop: "4px",
  },
  featureList: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    display: "flex",
    flexDirection: "column" as const,
    gap: "12px",
  },
  featureItem: {
    display: "flex",
    alignItems: "flex-start",
    gap: "10px",
  },
  featureText: {
    fontSize: "14px",
    color: "var(--color-text)",
    lineHeight: 1.5,
  },

  // Comparison table
  comparisonTable: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "14px",
  },
  thFeature: {
    textAlign: "left" as const,
    padding: "14px 16px",
    fontWeight: 700,
    color: "var(--color-tertiary)",
    borderBottom: "2px solid var(--color-border)",
    width: "34%",
  },
  thPlan: {
    textAlign: "center" as const,
    padding: "14px 16px",
    fontWeight: 700,
    color: "var(--color-tertiary)",
    borderBottom: "2px solid var(--color-border)",
  },
  thPopular: {
    color: "var(--color-primary)",
    background: "rgba(255,114,92,0.04)",
  },
  categoryRow: {
    background: "var(--color-background)",
    padding: "10px 16px",
    fontWeight: 700,
    fontSize: "11px",
    letterSpacing: "0.08em",
    textTransform: "uppercase" as const,
    color: "var(--color-secondary)",
  },
  dataRow: {
    borderBottom: "1px solid var(--color-border-light)",
  },
  tdFeature: {
    padding: "14px 16px",
    color: "var(--color-text)",
  },
  tdPlan: {
    padding: "14px 16px",
    textAlign: "center" as const,
    verticalAlign: "middle" as const,
  },
  tdPopular: {
    background: "rgba(255,114,92,0.03)",
  },
  cellText: {
    fontSize: "13px",
    color: "var(--color-secondary)",
    fontWeight: 500,
  },

  // Testimonials
  testimonialsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(3, 1fr)",
    gap: "24px",
  },
  testimonialCard: {
    padding: "32px",
    display: "flex",
    flexDirection: "column" as const,
    gap: "20px",
  },
  quoteIcon: {
    fontSize: "48px",
    lineHeight: 1,
    color: "var(--color-primary)",
    fontFamily: "Georgia, serif",
    opacity: 0.5,
    marginBottom: "-12px",
  },
  testimonialQuote: {
    fontSize: "15px",
    color: "var(--color-text)",
    lineHeight: 1.7,
    flexGrow: 1,
    margin: 0,
  },
  testimonialAuthor: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    paddingTop: "16px",
    borderTop: "1px solid var(--color-border-light)",
  },
  authorAvatar: {
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    background: "linear-gradient(135deg, var(--color-secondary), var(--color-tertiary))",
    color: "#fff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "13px",
    fontWeight: 700,
    flexShrink: 0,
  },
  authorName: {
    fontSize: "14px",
    fontWeight: 700,
    color: "var(--color-tertiary)",
  },
  authorMeta: {
    fontSize: "12px",
    color: "var(--color-text-muted)",
    marginTop: "2px",
  },

  // FAQ
  faqWrapper: {
    maxWidth: "760px",
    margin: "0 auto",
  },
  faqList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0",
  },
  faqItem: {
    borderBottom: "1px solid var(--color-border)",
    overflow: "hidden",
  },
  faqItemOpen: {
    borderColor: "var(--color-border)",
  },
  faqQuestion: {
    width: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    padding: "22px 0",
    background: "transparent",
    border: "none",
    cursor: "pointer",
    textAlign: "left" as const,
    gap: "16px",
  },
  faqQuestionText: {
    fontSize: "16px",
    fontWeight: 600,
    color: "var(--color-tertiary)",
    lineHeight: 1.4,
  },
  faqChevron: {
    color: "var(--color-text-muted)",
    flexShrink: 0,
    transition: "transform 0.2s ease",
    display: "flex",
    alignItems: "center",
  },
  faqChevronOpen: {
    transform: "rotate(180deg)",
    color: "var(--color-primary)",
  },
  faqAnswer: {
    paddingBottom: "22px",
  },

  // Bottom CTA
  bottomCta: {
    background: "linear-gradient(135deg, var(--color-tertiary) 0%, #0d4a73 50%, var(--color-secondary) 100%)",
    paddingTop: "96px",
    paddingBottom: "96px",
  },
  bottomCtaHeading: {
    fontSize: "clamp(28px, 4vw, 44px)",
    fontWeight: 800,
    color: "#ffffff",
    marginBottom: "20px",
    letterSpacing: "-0.02em",
  },
  bottomCtaSubtext: {
    fontSize: "17px",
    color: "rgba(255,255,255,0.72)",
    maxWidth: "560px",
    lineHeight: 1.7,
    margin: 0,
  },
  bottomCtaActions: {
    display: "flex",
    gap: "16px",
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
};
