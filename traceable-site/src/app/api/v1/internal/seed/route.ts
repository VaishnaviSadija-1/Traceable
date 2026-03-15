/**
 * POST /api/v1/internal/seed
 *
 * Seeds the database with realistic demo data for all tables.
 * Only meant for testing/demo purposes.
 */

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";

const now = new Date();
function hoursAgo(h: number) {
  return new Date(now.getTime() - h * 60 * 60 * 1000).toISOString();
}
function daysAgo(d: number) {
  return new Date(now.getTime() - d * 24 * 60 * 60 * 1000).toISOString();
}

// ── Company seed data ──────────────────────────────────────────────────

const COMPANIES = [
  {
    name: "Stripe",
    domain: "stripe.com",
    industry: "Fintech",
    employee_count: 8000,
    revenue_range: "$1B+",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS13335 Stripe Inc.",
    confidence: "high",
    tech_stack: ["React", "Ruby on Rails", "Go", "AWS", "PostgreSQL", "Kubernetes"],
    contacts: [
      { full_name: "Patrick Collison", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/patrickcollison", email: null },
      { full_name: "Emily Glassberg Sands", title: "Head of Information", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/egsands", email: null },
    ],
    business_signals: [
      { type: "hiring", title: "Expanding Sales Team", detail: "Posted 15+ sales and go-to-market roles across US and EMEA in Q1 2026", date: "2026-01" },
      { type: "funding", title: "Series I at $95B Valuation", detail: "Raised $6.5B in latest funding round led by Sequoia and a16z", date: "2025-03" },
      { type: "product_launch", title: "Stripe Billing v3 Launch", detail: "Released major upgrade to billing platform with AI-powered revenue recovery", date: "2025-11" },
    ],
    ai_summary: "Stripe is a leading fintech company headquartered in San Francisco with approximately 8,000 employees. Their team has been actively evaluating AI-powered sales automation tools, with multiple visits to the pricing and product pages over the past week. The combination of repeat visits, extended dwell time on case studies, and engagement from multiple team members suggests strong purchase intent at the decision stage.",
    ip: "104.16.0.0",
  },
  {
    name: "HubSpot",
    domain: "hubspot.com",
    industry: "SaaS",
    employee_count: 7400,
    revenue_range: "$500M–$1B",
    hq_city: "Cambridge",
    hq_country: "US",
    org: "AS14618 HubSpot Inc.",
    confidence: "high",
    tech_stack: ["Java", "React", "MySQL", "AWS", "Kafka", "Elasticsearch"],
    contacts: [
      { full_name: "Yamini Rangan", title: "CEO", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/yaminirangan", email: null },
      { full_name: "Kipp Bodnar", title: "CMO", role_type: "head_of_marketing", linkedin_url: "https://linkedin.com/in/kippbodnar", email: null },
    ],
    business_signals: [
      { type: "expansion", title: "APAC Market Expansion", detail: "Opened new offices in Singapore and Tokyo to serve growing Asia-Pacific customer base", date: "2025-09" },
      { type: "product_launch", title: "AI Sales Hub Launch", detail: "Released AI-powered Sales Hub with predictive deal scoring and automated outreach", date: "2026-01" },
    ],
    ai_summary: "HubSpot is a major SaaS provider based in Cambridge, MA, specializing in CRM, marketing, and sales automation software. Recent browsing activity on our platform shows their team researching competitor offerings, with significant time spent on the sales agent product page and case studies. Their behavior pattern — comparing multiple solutions across several sessions — is consistent with an evaluation-stage buyer assessing market alternatives.",
    ip: "104.16.1.0",
  },
  {
    name: "Figma",
    domain: "figma.com",
    industry: "Design Software",
    employee_count: 1500,
    revenue_range: "$100M–$500M",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS13335 Figma Inc.",
    confidence: "high",
    tech_stack: ["TypeScript", "React", "C++", "WebAssembly", "AWS", "Rust"],
    contacts: [
      { full_name: "Dylan Field", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/dylanfield", email: null },
      { full_name: "Yuhki Yamashita", title: "Chief Product Officer", role_type: "other", linkedin_url: "https://linkedin.com/in/yuhki", email: null },
    ],
    business_signals: [
      { type: "hiring", title: "Growing Enterprise Sales", detail: "Hiring 10+ enterprise account executives and solution architects", date: "2026-02" },
      { type: "product_launch", title: "Figma Slides GA", detail: "General availability of presentation tool expanding beyond design", date: "2025-10" },
    ],
    ai_summary: "Figma is a rapidly growing design software company with approximately 1,500 employees, best known for their browser-based collaborative design tool. A visitor from their organization has browsed the pricing page and general product pages, indicating early-stage interest in sales intelligence solutions. The single-session visit with moderate dwell time suggests an awareness-stage exploration rather than active purchasing evaluation.",
    ip: "104.16.2.0",
  },
  {
    name: "Datadog",
    domain: "datadoghq.com",
    industry: "Enterprise Software",
    employee_count: 5500,
    revenue_range: "$1B+",
    hq_city: "New York",
    hq_country: "US",
    org: "AS394699 Datadog Inc.",
    confidence: "high",
    tech_stack: ["Go", "Python", "React", "Kubernetes", "Cassandra", "Kafka"],
    contacts: [
      { full_name: "Olivier Pomel", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/olivierpomel", email: null },
      { full_name: "Alex Rosemblat", title: "VP of Revenue Operations", role_type: "revops", linkedin_url: "https://linkedin.com/in/alexrosemblat", email: null },
    ],
    business_signals: [
      { type: "funding", title: "Strong Q4 Earnings", detail: "Revenue grew 26% YoY to $2.1B ARR, beating analyst estimates", date: "2026-02" },
      { type: "expansion", title: "FedRAMP Authorization", detail: "Received FedRAMP High authorization opening US federal government market", date: "2025-08" },
      { type: "partnership", title: "AWS Strategic Partnership", detail: "Expanded partnership with AWS for integrated cloud monitoring solutions", date: "2025-12" },
    ],
    ai_summary: "Datadog is a publicly traded enterprise monitoring and analytics platform headquartered in New York with over 5,500 employees. Their revenue operations team has demonstrated high-intent behavior, visiting the pricing page multiple times and spending considerable time reviewing case studies relevant to B2B SaaS companies. This pattern, combined with repeat visits across different days, strongly indicates an active evaluation with budget consideration underway.",
    ip: "104.16.3.0",
  },
  {
    name: "Notion",
    domain: "notion.so",
    industry: "SaaS",
    employee_count: 800,
    revenue_range: "$50M–$100M",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS13335 Notion Labs Inc.",
    confidence: "medium",
    tech_stack: ["TypeScript", "React", "Kotlin", "PostgreSQL", "AWS"],
    contacts: [
      { full_name: "Ivan Zhao", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/ivanzhao", email: null },
    ],
    business_signals: [
      { type: "product_launch", title: "Notion Mail Launch", detail: "Launched integrated email client as part of the Notion workspace", date: "2026-01" },
    ],
    ai_summary: "Notion is a productivity and collaboration platform based in San Francisco with approximately 800 employees. A single visitor from their network browsed general pages and briefly visited the product overview. The short session duration and limited page depth suggest early research or casual exploration rather than active buying intent.",
    ip: "104.16.4.0",
  },
  {
    name: "Ramp",
    domain: "ramp.com",
    industry: "Fintech",
    employee_count: 1200,
    revenue_range: "$100M–$500M",
    hq_city: "New York",
    hq_country: "US",
    org: "AS16509 Ramp Financial",
    confidence: "high",
    tech_stack: ["Python", "React", "Django", "PostgreSQL", "AWS", "Snowflake"],
    contacts: [
      { full_name: "Eric Glyman", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/ericglyman", email: null },
      { full_name: "Geoff Charles", title: "VP of Product", role_type: "other", linkedin_url: "https://linkedin.com/in/geoffcharles", email: null },
    ],
    business_signals: [
      { type: "funding", title: "Series D+ at $13B Valuation", detail: "Raised $150M extension round led by Thrive Capital", date: "2025-06" },
      { type: "hiring", title: "Rapid Headcount Growth", detail: "Grew from 800 to 1,200 employees in 12 months, hiring across sales and engineering", date: "2025-12" },
      { type: "product_launch", title: "Ramp Intelligence Launch", detail: "Released AI-powered spend management and procurement automation features", date: "2026-02" },
    ],
    ai_summary: "Ramp is a fast-growing fintech company in New York specializing in corporate card and expense management solutions, with around 1,200 employees. Multiple visitors from their organization have accessed the platform over the past 48 hours, with concentrated activity on the pricing and sales agent pages. The multi-person engagement from a single company, combined with extended time on high-intent pages, is a strong indicator of an active buying committee in the decision stage.",
    ip: "104.16.5.0",
  },
  {
    name: "Airtable",
    domain: "airtable.com",
    industry: "SaaS",
    employee_count: 900,
    revenue_range: "$100M–$500M",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS16509 Airtable Inc.",
    confidence: "medium",
    tech_stack: ["Node.js", "React", "Ruby", "PostgreSQL", "AWS", "Redis"],
    contacts: [
      { full_name: "Howie Liu", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/howieliu", email: null },
    ],
    business_signals: [
      { type: "expansion", title: "Enterprise Tier Launch", detail: "Introduced new enterprise pricing tier with advanced governance and security features", date: "2025-10" },
    ],
    ai_summary: "Airtable is a no-code platform company based in San Francisco with approximately 900 employees. A visitor from their organization spent time reviewing case studies and the product overview, suggesting evaluation of complementary sales tools. The moderate session duration and focus on social proof content indicates a consideration-stage interest that may benefit from targeted nurture outreach.",
    ip: "104.16.6.0",
  },
  {
    name: "Plaid",
    domain: "plaid.com",
    industry: "Fintech",
    employee_count: 1100,
    revenue_range: "$100M–$500M",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS16509 Plaid Inc.",
    confidence: "high",
    tech_stack: ["Go", "Python", "React", "PostgreSQL", "AWS", "gRPC"],
    contacts: [
      { full_name: "Zach Perret", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/zachperret", email: null },
      { full_name: "Jennifer Taylor", title: "VP of Sales", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/jennifertaylor", email: null },
    ],
    business_signals: [
      { type: "partnership", title: "Visa Direct Integration", detail: "Partnered with Visa to enable instant bank-to-card transfers via Plaid Transfer", date: "2025-11" },
      { type: "hiring", title: "Sales Team Expansion", detail: "Hiring VP Sales, 5 enterprise AEs and 3 solutions engineers for mid-market push", date: "2026-01" },
    ],
    ai_summary: "Plaid is a financial infrastructure company headquartered in San Francisco with approximately 1,100 employees, enabling applications to connect with users' bank accounts. Their VP of Sales has been identified visiting the pricing page and reviewing case studies over two separate sessions. This repeat, high-intent behavior from a senior sales leader strongly suggests Plaid is actively evaluating visitor intelligence platforms for their own go-to-market motion.",
    ip: "104.16.7.0",
  },
  {
    name: "BrightPath Lending",
    domain: "brightpathlending.com",
    industry: "Mortgage Lending",
    employee_count: 200,
    revenue_range: "$10M–$50M",
    hq_city: "Chicago",
    hq_country: "US",
    org: "BrightPath Lending LLC",
    confidence: "high",
    tech_stack: ["Salesforce", "Encompass", "WordPress", "Google Analytics", "HubSpot"],
    contacts: [
      { full_name: "Sarah Mitchell", title: "CEO & Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/sarahmitchell", email: null },
      { full_name: "David Chen", title: "VP of Sales", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/davidchen", email: null },
    ],
    business_signals: [
      { type: "expansion", title: "Southeast Market Entry", detail: "Expanded mortgage origination operations into Florida, Georgia, and North Carolina", date: "2025-09" },
      { type: "hiring", title: "Loan Officer Recruitment Drive", detail: "Hiring 25+ loan officers across 4 new state markets", date: "2026-01" },
      { type: "product_launch", title: "Digital Mortgage Platform", detail: "Launched fully digital mortgage application and approval platform for borrowers", date: "2025-11" },
    ],
    ai_summary: "BrightPath Lending is a mid-sized mortgage lender headquartered in Chicago with approximately 200 employees. Recent browsing behavior indicates active evaluation of AI-powered sales automation tools, with multiple visits to pricing and case study pages. The combination of repeat visits and high dwell time on mortgage-relevant content suggests strong purchase intent from a company undergoing rapid growth.",
    ip: "104.16.8.0",
  },
  {
    name: "Rocket Mortgage",
    domain: "rocketmortgage.com",
    industry: "Mortgage Lending",
    employee_count: 27000,
    revenue_range: "$1B+",
    hq_city: "Detroit",
    hq_country: "US",
    org: "Rocket Companies Inc.",
    confidence: "high",
    tech_stack: ["React", "Java", "AWS", "Salesforce", "Snowflake", "Kubernetes", "Tableau"],
    contacts: [
      { full_name: "Varun Krishna", title: "CEO", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/varunkrishna", email: null },
      { full_name: "Bill Banfield", title: "EVP of Capital Markets", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/billbanfield", email: null },
    ],
    business_signals: [
      { type: "product_launch", title: "AI-Powered Mortgage Assistant", detail: "Launched Rocket Logic AI assistant for personalized mortgage recommendations", date: "2026-02" },
      { type: "partnership", title: "Salesforce Partnership", detail: "Expanded CRM partnership with Salesforce for enhanced lead management", date: "2025-10" },
      { type: "hiring", title: "Technology Division Growth", detail: "Hiring 200+ engineers and data scientists for AI/ML initiatives", date: "2026-01" },
      { type: "funding", title: "Strong Q4 Earnings", detail: "Reported 45% YoY increase in origination volume driven by rate environment", date: "2026-02" },
    ],
    ai_summary: "Rocket Mortgage is America's largest mortgage lender headquartered in Detroit with over 27,000 employees. A senior operations leader has been actively evaluating AI sales tools, with focused engagement on pricing and product demo pages across multiple sessions. The multi-day visit pattern from a large enterprise suggests a formal vendor evaluation process is underway.",
    ip: "104.16.9.0",
  },
  {
    name: "Redfin",
    domain: "redfin.com",
    industry: "Real Estate Technology",
    employee_count: 4500,
    revenue_range: "$500M–$1B",
    hq_city: "Seattle",
    hq_country: "US",
    org: "Redfin Corporation",
    confidence: "high",
    tech_stack: ["React", "Java", "Python", "AWS", "PostgreSQL", "Elasticsearch", "Kafka"],
    contacts: [
      { full_name: "Glenn Kelman", title: "CEO", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/glennkelman", email: null },
      { full_name: "Adam Wiener", title: "President of Real Estate Operations", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/adamwiener", email: null },
    ],
    business_signals: [
      { type: "product_launch", title: "Redfin Redesign Launch", detail: "Major website and mobile app redesign with AI-powered home recommendations", date: "2025-12" },
      { type: "expansion", title: "Luxury Market Push", detail: "Launched dedicated luxury real estate division in 15 major metro areas", date: "2025-08" },
      { type: "hiring", title: "Agent Recruitment", detail: "Hiring 500+ real estate agents ahead of spring selling season", date: "2026-03" },
    ],
    ai_summary: "Redfin is a technology-powered real estate company based in Seattle with approximately 4,500 employees. Their team has shown moderate interest in sales intelligence solutions, browsing case studies and the product overview page. The evaluation-stage behavior suggests Redfin may be exploring tools to enhance their agent productivity and lead conversion workflows.",
    ip: "104.16.10.0",
  },
  {
    name: "Snowflake",
    domain: "snowflake.com",
    industry: "Cloud Data Platform",
    employee_count: 6800,
    revenue_range: "$1B+",
    hq_city: "Bozeman",
    hq_country: "US",
    org: "AS40068 Snowflake Inc.",
    confidence: "high",
    tech_stack: ["Java", "C++", "Python", "React", "AWS", "Azure", "Kubernetes"],
    contacts: [
      { full_name: "Sridhar Ramaswamy", title: "CEO", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/sridharramaswamy", email: null },
      { full_name: "Denise Persson", title: "CMO", role_type: "head_of_marketing", linkedin_url: "https://linkedin.com/in/denisepersson", email: null },
    ],
    business_signals: [
      { type: "product_launch", title: "Snowflake Cortex AI GA", detail: "Released general availability of Cortex AI for in-warehouse machine learning and LLM inference", date: "2026-01" },
      { type: "partnership", title: "Salesforce Data Cloud Integration", detail: "Deepened zero-copy data sharing partnership with Salesforce for unified customer profiles", date: "2025-11" },
      { type: "hiring", title: "Go-To-Market Expansion", detail: "Hiring 80+ enterprise account executives and solution engineers globally", date: "2026-02" },
    ],
    ai_summary: "Snowflake is a leading cloud data platform company headquartered in Bozeman, MT with approximately 6,800 employees. Their go-to-market team has shown strong decision-stage intent, with a senior leader visiting pricing and product pages across multiple sessions over the past 3 days. The pattern of repeat visits from an enterprise of this scale, combined with focused engagement on competitive comparison content, strongly suggests an active vendor evaluation with budget approval in progress.",
    ip: "104.16.11.0",
  },
  {
    name: "Gong",
    domain: "gong.io",
    industry: "Revenue Intelligence",
    employee_count: 1600,
    revenue_range: "$100M–$500M",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS16509 Gong.io Inc.",
    confidence: "high",
    tech_stack: ["Python", "React", "Node.js", "AWS", "Elasticsearch", "TensorFlow"],
    contacts: [
      { full_name: "Amit Bendov", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/amitbendov", email: null },
      { full_name: "Ryan Longfield", title: "CRO", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/ryanlongfield", email: null },
    ],
    business_signals: [
      { type: "funding", title: "Series E at $7.25B Valuation", detail: "Raised $250M from Franklin Templeton and existing investors", date: "2025-08" },
      { type: "product_launch", title: "Gong Engage Launch", detail: "Released integrated sales engagement platform combining conversation intelligence with multi-channel outreach", date: "2026-02" },
      { type: "expansion", title: "EMEA Expansion", detail: "Opened new London and Frankfurt offices to serve European enterprise customers", date: "2025-10" },
    ],
    ai_summary: "Gong is a revenue intelligence platform based in San Francisco with approximately 1,600 employees, known for conversation analytics and deal intelligence. Their CRO has personally visited the platform, spending significant time on the sales agent feature page and reviewing pricing tiers. As a company deeply embedded in the sales tech ecosystem, their interest in a visitor intelligence tool suggests they may be looking to expand their own go-to-market stack or evaluate complementary solutions for their customers.",
    ip: "104.16.12.0",
  },
  {
    name: "Lattice",
    domain: "lattice.com",
    industry: "HR Technology",
    employee_count: 650,
    revenue_range: "$50M–$100M",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS16509 Lattice HQ Inc.",
    confidence: "medium",
    tech_stack: ["Ruby on Rails", "React", "PostgreSQL", "AWS", "Redis", "Sidekiq"],
    contacts: [
      { full_name: "Jack Altman", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/jackaltman", email: null },
      { full_name: "Cara Brennan Allamano", title: "CPO", role_type: "other", linkedin_url: "https://linkedin.com/in/caraallamano", email: null },
    ],
    business_signals: [
      { type: "product_launch", title: "Lattice HRIS GA", detail: "Full HRIS platform now generally available, expanding beyond performance management", date: "2025-12" },
      { type: "hiring", title: "Mid-Market Sales Push", detail: "Building out dedicated mid-market sales team with 12 new AE positions", date: "2026-01" },
    ],
    ai_summary: "Lattice is a people management platform based in San Francisco with approximately 650 employees, offering performance reviews, engagement surveys, and compensation management. A visitor from their team browsed the general product pages and briefly checked pricing, suggesting early-stage interest in sales intelligence tools. The short session and limited engagement indicate awareness-level exploration rather than active purchase intent.",
    ip: "104.16.13.0",
  },
  {
    name: "Brex",
    domain: "brex.com",
    industry: "Fintech",
    employee_count: 1100,
    revenue_range: "$100M–$500M",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS16509 Brex Inc.",
    confidence: "high",
    tech_stack: ["Kotlin", "React", "TypeScript", "AWS", "PostgreSQL", "Kafka", "Temporal"],
    contacts: [
      { full_name: "Pedro Franceschi", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/pedrofranceschi", email: null },
      { full_name: "Sam Blond", title: "CRO", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/samblond", email: null },
    ],
    business_signals: [
      { type: "product_launch", title: "Brex Empower Launch", detail: "Released AI-powered expense management platform targeting mid-market and enterprise", date: "2026-01" },
      { type: "expansion", title: "Enterprise Upmarket Push", detail: "Shifted focus from startup market to enterprise segment with dedicated sales team", date: "2025-09" },
      { type: "hiring", title: "Enterprise Sales Hiring", detail: "Hiring 20+ enterprise account executives and solutions consultants", date: "2026-03" },
    ],
    ai_summary: "Brex is a corporate spend management platform headquartered in San Francisco with approximately 1,100 employees. Their CRO has visited the platform multiple times over 48 hours, with deep engagement on pricing, case studies, and the sales agent product page. The multi-session, high-dwell-time pattern from a C-level revenue leader is a strong buying signal — Brex appears to be actively evaluating visitor intelligence solutions as part of their enterprise go-to-market expansion.",
    ip: "104.16.14.0",
  },
  {
    name: "Calendly",
    domain: "calendly.com",
    industry: "SaaS",
    employee_count: 700,
    revenue_range: "$100M–$500M",
    hq_city: "Atlanta",
    hq_country: "US",
    org: "AS16509 Calendly LLC",
    confidence: "medium",
    tech_stack: ["Ruby on Rails", "React", "PostgreSQL", "AWS", "Elasticsearch"],
    contacts: [
      { full_name: "Tope Awotona", title: "CEO & Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/topeawotona", email: null },
    ],
    business_signals: [
      { type: "product_launch", title: "Calendly Routing Launch", detail: "Introduced intelligent lead routing and round-robin scheduling for sales teams", date: "2025-10" },
      { type: "expansion", title: "Enterprise Tier Growth", detail: "Enterprise customer base grew 40% YoY driven by new routing and analytics features", date: "2026-02" },
    ],
    ai_summary: "Calendly is a scheduling automation platform based in Atlanta with approximately 700 employees. A visitor from their team viewed case studies and the product overview page during a single session. The moderate engagement pattern suggests they are in the evaluation stage, potentially researching how visitor intelligence tools could complement their scheduling and sales routing platform.",
    ip: "104.16.15.0",
  },
  {
    name: "Toast",
    domain: "toasttab.com",
    industry: "Restaurant Technology",
    employee_count: 5000,
    revenue_range: "$1B+",
    hq_city: "Boston",
    hq_country: "US",
    org: "AS16509 Toast Inc.",
    confidence: "high",
    tech_stack: ["Java", "Kotlin", "React", "AWS", "PostgreSQL", "Redis", "Kafka"],
    contacts: [
      { full_name: "Aman Narang", title: "CEO", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/amannarang", email: null },
      { full_name: "Jonathan Vassil", title: "CRO", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/jonathanvassil", email: null },
    ],
    business_signals: [
      { type: "funding", title: "Strong Earnings Report", detail: "Q4 revenue grew 30% YoY to $1.3B ARR with improving unit economics", date: "2026-02" },
      { type: "expansion", title: "International Launch", detail: "Expanded restaurant POS platform into UK, Ireland, and Canada markets", date: "2025-11" },
      { type: "hiring", title: "Sales Force Expansion", detail: "Hiring 150+ field sales reps across North America for SMB restaurant acquisition", date: "2026-01" },
    ],
    ai_summary: "Toast is a restaurant technology platform headquartered in Boston with approximately 5,000 employees, providing POS systems, payment processing, and restaurant management software. Multiple visitors from their sales operations team have engaged with pricing and the sales agent product page across several sessions. The multi-person, decision-stage behavior pattern from a rapidly scaling sales organization indicates Toast is actively seeking visitor intelligence tools to improve their own outbound sales motion to restaurants.",
    ip: "104.16.16.0",
  },
  {
    name: "Deel",
    domain: "deel.com",
    industry: "HR Technology",
    employee_count: 4000,
    revenue_range: "$500M–$1B",
    hq_city: "San Francisco",
    hq_country: "US",
    org: "AS16509 Deel Inc.",
    confidence: "high",
    tech_stack: ["Node.js", "React", "TypeScript", "PostgreSQL", "AWS", "MongoDB", "Redis"],
    contacts: [
      { full_name: "Alex Bouaziz", title: "CEO & Co-Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/alexbouaziz", email: null },
      { full_name: "Dan Westgarth", title: "COO", role_type: "other", linkedin_url: "https://linkedin.com/in/danwestgarth", email: null },
    ],
    business_signals: [
      { type: "funding", title: "Series D at $12B Valuation", detail: "Raised $300M led by Spark Capital, becoming one of the highest-valued HR tech companies", date: "2025-07" },
      { type: "product_launch", title: "Deel AI Assistant", detail: "Launched AI-powered compliance and payroll assistant for global workforce management", date: "2026-01" },
      { type: "expansion", title: "Rapid Global Growth", detail: "Now operating in 150+ countries with 15,000+ business customers, triple from 2024", date: "2026-02" },
    ],
    ai_summary: "Deel is a global payroll and HR platform headquartered in San Francisco with approximately 4,000 employees, enabling companies to hire and pay workers in 150+ countries. Their operations team has visited the platform with concentrated attention on pricing and product comparison pages. The evaluation-stage behavior from a high-growth company actively scaling their sales motion makes Deel a strong prospect for visitor intelligence and sales automation tools.",
    ip: "104.16.17.0",
  },
  {
    name: "Zscaler",
    domain: "zscaler.com",
    industry: "Cybersecurity",
    employee_count: 7500,
    revenue_range: "$1B+",
    hq_city: "San Jose",
    hq_country: "US",
    org: "AS22616 Zscaler Inc.",
    confidence: "high",
    tech_stack: ["Java", "Go", "Python", "React", "AWS", "GCP", "Kubernetes"],
    contacts: [
      { full_name: "Jay Chaudhry", title: "CEO & Founder", role_type: "ceo_founder", linkedin_url: "https://linkedin.com/in/jaychaudhry", email: null },
      { full_name: "Mike Rich", title: "CRO", role_type: "vp_sales", linkedin_url: "https://linkedin.com/in/mikerich", email: null },
    ],
    business_signals: [
      { type: "funding", title: "Record Revenue Quarter", detail: "Q1 FY2027 revenue grew 28% YoY to $2.3B ARR, driven by platform adoption", date: "2026-02" },
      { type: "product_launch", title: "Zero Trust SASE Platform", detail: "Unified zero trust and SASE capabilities into single cloud-native platform", date: "2025-10" },
      { type: "hiring", title: "Channel Sales Growth", detail: "Expanding channel partner program with 50+ new enterprise partner positions", date: "2026-03" },
    ],
    ai_summary: "Zscaler is a leading cybersecurity company based in San Jose with approximately 7,500 employees, specializing in cloud-native zero trust security. A senior sales leader has engaged with the platform during a single extended session, reviewing case studies and the sales agent product page. The focused, research-oriented browsing pattern from an enterprise of this caliber suggests Zscaler is exploring how visitor intelligence could enhance their own enterprise sales and channel partner enablement strategy.",
    ip: "104.16.18.0",
  },
];

// ── Page visit patterns ────────────────────────────────────────────────

const VISIT_PATTERNS: Record<string, { pages: { url: string; cat: string; duration: number }[]; score: number; stage: string; buyer: string }> = {
  decision_high: {
    pages: [
      { url: "https://traceable.app/", cat: "other", duration: 25 },
      { url: "https://traceable.app/pricing", cat: "pricing", duration: 180 },
      { url: "https://traceable.app/case-studies", cat: "case-studies", duration: 120 },
      { url: "https://traceable.app/sales-agent", cat: "sales-agent", duration: 90 },
      { url: "https://traceable.app/pricing", cat: "pricing", duration: 60 },
    ],
    score: 88,
    stage: "Decision",
    buyer: "decision",
  },
  evaluation: {
    pages: [
      { url: "https://traceable.app/", cat: "other", duration: 15 },
      { url: "https://traceable.app/sales-agent", cat: "sales-agent", duration: 110 },
      { url: "https://traceable.app/case-studies", cat: "case-studies", duration: 95 },
      { url: "https://traceable.app/pricing", cat: "pricing", duration: 45 },
    ],
    score: 65,
    stage: "Evaluation",
    buyer: "consideration",
  },
  awareness: {
    pages: [
      { url: "https://traceable.app/", cat: "other", duration: 40 },
      { url: "https://traceable.app/sales-agent", cat: "sales-agent", duration: 30 },
    ],
    score: 35,
    stage: "Awareness",
    buyer: "awareness",
  },
  research: {
    pages: [
      { url: "https://traceable.app/", cat: "other", duration: 20 },
    ],
    score: 12,
    stage: "Research",
    buyer: "unknown",
  },
};

const COMPANY_PATTERNS = [
  // Original 11 companies
  { idx: 0, pattern: "decision_high", hours: 2, repeat: true, multi: true },    // Stripe
  { idx: 1, pattern: "evaluation", hours: 5, repeat: false, multi: false },      // HubSpot
  { idx: 2, pattern: "awareness", hours: 12, repeat: false, multi: false },      // Figma
  { idx: 3, pattern: "decision_high", hours: 8, repeat: true, multi: false },    // Datadog
  { idx: 4, pattern: "research", hours: 20, repeat: false, multi: false },       // Notion
  { idx: 5, pattern: "decision_high", hours: 3, repeat: true, multi: true },     // Ramp
  { idx: 6, pattern: "evaluation", hours: 15, repeat: false, multi: false },     // Airtable
  { idx: 7, pattern: "decision_high", hours: 6, repeat: true, multi: false },    // Plaid
  { idx: 8, pattern: "decision_high", hours: 4, repeat: true, multi: true },     // BrightPath Lending
  { idx: 9, pattern: "evaluation", hours: 10, repeat: false, multi: false },     // Rocket Mortgage
  { idx: 10, pattern: "evaluation", hours: 7, repeat: true, multi: false },      // Redfin
  // New 8 companies
  { idx: 11, pattern: "decision_high", hours: 1, repeat: true, multi: true },    // Snowflake
  { idx: 12, pattern: "decision_high", hours: 5, repeat: true, multi: false },   // Gong
  { idx: 13, pattern: "awareness", hours: 18, repeat: false, multi: false },     // Lattice
  { idx: 14, pattern: "decision_high", hours: 2, repeat: true, multi: true },    // Brex
  { idx: 15, pattern: "evaluation", hours: 9, repeat: false, multi: false },     // Calendly
  { idx: 16, pattern: "decision_high", hours: 3, repeat: true, multi: true },    // Toast
  { idx: 17, pattern: "evaluation", hours: 6, repeat: true, multi: false },      // Deel
  { idx: 18, pattern: "evaluation", hours: 11, repeat: false, multi: false },    // Zscaler
];

export async function POST() {
  const db = getSupabaseAdmin();

  try {
    // ── 0. Clean up ALL old data ─────────────────────────────────────
    // Wipe all transactional tables so we start fresh for demo
    await db.from("emails_sent").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("alerts").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("scores").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("session_events").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("identities").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    await db.from("sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");

    // ── 1. Insert companies ────────────────────────────────────────────
    const companyIds: string[] = [];

    for (const c of COMPANIES) {
      const { data: existing } = await db
        .from("companies")
        .select("id")
        .eq("domain", c.domain)
        .single();

      if (existing) {
        // Update existing
        await db
          .from("companies")
          .update({
            name: c.name,
            industry: c.industry,
            employee_count: c.employee_count,
            revenue_range: c.revenue_range,
            hq_city: c.hq_city,
            hq_country: c.hq_country,
            org: c.org,
            confidence: c.confidence,
            tech_stack: c.tech_stack,
            contacts: c.contacts,
            business_signals: c.business_signals,
            ai_summary: c.ai_summary,
            ai_summary_generated_at: hoursAgo(1),
            enriched_at: daysAgo(2),
            last_seen_at: hoursAgo(1),
            updated_at: now.toISOString(),
          })
          .eq("id", existing.id);
        companyIds.push(existing.id);
      } else {
        const { data: inserted } = await db
          .from("companies")
          .insert({
            name: c.name,
            domain: c.domain,
            industry: c.industry,
            employee_count: c.employee_count,
            revenue_range: c.revenue_range,
            hq_city: c.hq_city,
            hq_country: c.hq_country,
            org: c.org,
            confidence: c.confidence,
            tech_stack: c.tech_stack,
            contacts: c.contacts,
            business_signals: c.business_signals,
            ai_summary: c.ai_summary,
            ai_summary_generated_at: hoursAgo(1),
            enriched_at: daysAgo(2),
            last_seen_at: hoursAgo(1),
            created_at: daysAgo(5),
            updated_at: now.toISOString(),
          })
          .select("id")
          .single();

        companyIds.push(inserted?.id ?? "");
      }
    }

    // ── 2. Insert sessions, events, scores, identities, alerts ────────
    const sessionIds: string[] = [];

    for (const cp of COMPANY_PATTERNS) {
      const company = COMPANIES[cp.idx];
      const companyId = companyIds[cp.idx];
      const pattern = VISIT_PATTERNS[cp.pattern];
      const sessionTime = hoursAgo(cp.hours);

      // Create session
      const pages = pattern.pages.map((p, i) => ({
        page_url: p.url,
        page_category: p.cat,
        entered_at: new Date(new Date(sessionTime).getTime() + i * 60000).toISOString(),
        duration_seconds: p.duration,
      }));

      const { data: session } = await db
        .from("sessions")
        .insert({
          visitor_id: `demo_${company.domain.replace(".", "_")}_${Math.random().toString(36).slice(2, 8)}`,
          ip: company.ip,
          user_agent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          referrer: ["https://google.com", "https://linkedin.com", null, "https://g2.com"][cp.idx % 4],
          landing_url: pattern.pages[0].url,
          pages,
          company_id: companyId,
          created_at: sessionTime,
          updated_at: new Date(new Date(sessionTime).getTime() + pattern.pages.length * 60000).toISOString(),
        })
        .select("id")
        .single();

      if (!session) continue;
      sessionIds.push(session.id);

      // Create session events
      const events = [];
      for (let i = 0; i < pattern.pages.length; i++) {
        const p = pattern.pages[i];
        const ts = new Date(new Date(sessionTime).getTime() + i * 60000).toISOString();

        events.push({
          session_id: session.id,
          event_type: "page_view",
          page_url: p.url,
          page_category: p.cat,
          metadata: null,
          duration_seconds: null,
          timestamp: ts,
        });

        events.push({
          session_id: session.id,
          event_type: "page_leave",
          page_url: p.url,
          page_category: p.cat,
          metadata: { duration_seconds: p.duration },
          duration_seconds: p.duration,
          timestamp: new Date(new Date(ts).getTime() + p.duration * 1000).toISOString(),
        });
      }

      await db.from("session_events").insert(events);

      // Create identity
      await db.from("identities").upsert(
        {
          session_id: session.id,
          source: "ipinfo",
          full_name: null,
          company_name: company.name,
          company_domain: company.domain,
          location: `${company.hq_city}, ${company.hq_country}`,
          country: company.hq_country,
          created_at: sessionTime,
          updated_at: sessionTime,
        },
        { onConflict: "session_id,source" }
      );

      // Create score
      const totalDwell = pattern.pages.reduce((sum, p) => sum + p.duration, 0);
      const fitScore = company.employee_count >= 50 ? 70 : 30;
      const leadScore = Math.round(pattern.score * 0.6 + fitScore * 0.4);
      const highIntentPages = pattern.pages.filter(
        (p) => p.cat === "pricing" || p.cat === "sales-agent"
      ).length;

      await db.from("scores").upsert(
        {
          session_id: session.id,
          company_id: companyId,
          score: pattern.score,
          score_out_of_10: Math.round(pattern.score / 10 * 10) / 10,
          intent_stage: pattern.stage,
          fit_score: fitScore,
          lead_score: leadScore,
          buyer_stage: pattern.buyer,
          pages_visited: [...new Set(pattern.pages.map((p) => p.cat))],
          repeat_visit: cp.repeat,
          multi_person: cp.multi,
          high_intent_pages: highIntentPages,
          session_duration_secs: totalDwell,
          persona: cp.pattern === "decision_high"
            ? "VP of Sales / Head of Revenue"
            : cp.pattern === "evaluation"
            ? "Head of Sales Operations"
            : "General Visitor",
          persona_confidence: cp.pattern === "decision_high" ? 78 : cp.pattern === "evaluation" ? 68 : 45,
          persona_signals: cp.pattern === "decision_high"
            ? ["High pricing page dwell", "Cross-referenced sales-agent and case studies"]
            : cp.pattern === "evaluation"
            ? ["Case studies dwell", "Evaluation-stage behavior"]
            : ["Mixed page activity"],
          recommended_actions: cp.pattern === "decision_high"
            ? [
                { action: `High-intent visitor from ${company.name}. Prioritize immediate outreach`, priority: "high" },
                { action: `Reach out to decision makers at ${company.name}`, priority: "high" },
                { action: `Send personalized outreach referencing ${company.industry} case studies`, priority: "high" },
              ]
            : cp.pattern === "evaluation"
            ? [
                { action: `Visitor from ${company.name} is actively evaluating — prepare tailored demo`, priority: "high" },
                { action: `Share relevant case studies and ROI data with ${company.name}`, priority: "medium" },
              ]
            : [
                { action: `Add ${company.name} to nurture email campaign`, priority: "medium" },
                { action: `Monitor for increased activity from ${company.name}`, priority: "low" },
              ],
          computed_at: sessionTime,
        },
        { onConflict: "session_id" }
      );

      // Create alert for high-intent sessions
      if (pattern.score >= 60) {
        const { data: alert } = await db
          .from("alerts")
          .insert({
            session_id: session.id,
            company_id: companyId,
            score: pattern.score,
            lead_score: leadScore,
            status: "sent",
            slack_sent: false,
            email_sent: true,
            metadata: {
              urgency: pattern.score >= 70 ? "high" : "medium",
              is_repeat: cp.repeat,
              buyer_stage: pattern.buyer,
              demo_data: true,
            },
            created_at: sessionTime,
          })
          .select("id")
          .single();

        // Track email
        if (alert) {
          await db.from("emails_sent").insert({
            type: "alert",
            subject: `[${pattern.score >= 70 ? "High Intent" : "Medium Intent"}] ${company.name} is on your site`,
            recipient: process.env.SALES_TEAM_EMAIL ?? "demo@traceable.app",
            company_id: companyId,
            session_id: session.id,
            alert_id: alert.id,
            status: "sent",
            metadata: { demo_data: true },
            created_at: sessionTime,
          });
        }
      }

      // Create a second session for multi-person companies
      if (cp.multi) {
        const secondTime = hoursAgo(cp.hours + 4);
        const secondPages = pattern.pages.slice(0, 3).map((p, i) => ({
          page_url: p.url,
          page_category: p.cat,
          entered_at: new Date(new Date(secondTime).getTime() + i * 60000).toISOString(),
          duration_seconds: Math.round(p.duration * 0.8),
        }));

        await db.from("sessions").insert({
          visitor_id: `demo_${company.domain.replace(".", "_")}_second_${Math.random().toString(36).slice(2, 8)}`,
          ip: company.ip,
          user_agent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
          landing_url: pattern.pages[0].url,
          pages: secondPages,
          company_id: companyId,
          created_at: secondTime,
          updated_at: new Date(new Date(secondTime).getTime() + 3 * 60000).toISOString(),
        });
      }
    }

    // ── 3. Add a demo daily digest email ──────────────────────────────
    await db.from("emails_sent").insert({
      type: "daily_digest",
      subject: `Traceable Daily Digest — 14 visitors detected (${new Date(daysAgo(1)).toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })})`,
      recipient: process.env.SALES_TEAM_EMAIL ?? "demo@traceable.app",
      status: "sent",
      metadata: { entries_count: 14, demo_data: true },
      created_at: daysAgo(1),
    });

    // ── 4. Add a demo AI summary email ────────────────────────────────
    await db.from("emails_sent").insert({
      type: "account_intelligence",
      subject: "Account Intelligence: Stripe",
      recipient: process.env.SALES_TEAM_EMAIL ?? "demo@traceable.app",
      company_id: companyIds[0],
      status: "sent",
      metadata: { demo_data: true },
      created_at: hoursAgo(4),
    });

    return NextResponse.json({
      ok: true,
      companies_seeded: COMPANIES.length,
      sessions_seeded: sessionIds.length,
      message: "Demo data seeded successfully",
    });
  } catch (err) {
    console.error("[seed] Error:", err);
    return NextResponse.json(
      { error: "Seed failed", details: String(err) },
      { status: 500 }
    );
  }
}
