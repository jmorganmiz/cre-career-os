export const careerProfile = {
  name: "Jack Morgan",
  school: "University of Missouri (Mizzou)",
  degree: "B.A. Economics",
  minor: "Psychology",
  graduation: "Spring 2027",
  currentLocation: "Missouri | Summer 2026 Yardi Internship",
  targetLocations: ["Dallas, TX", "Charleston, SC", "Charlotte, NC", "San Diego, CA"],
  secondaryLocations: ["New York City for exceptional opportunities only"],
  targetRoles: [
    "Acquisitions Analyst", "Investment Analyst", "Multifamily Analyst", "Development Analyst",
    "Asset Management Analyst", "Capital Markets Analyst", "Debt Analyst", "Agency Lending Analyst",
    "Mortgage Banking Analyst", "Real Estate Analyst", "Strategy Analyst", "Corporate Strategy Analyst",
    "Competitive Intelligence Analyst", "Business Intelligence Analyst", "AI Strategy Analyst",
    "PropTech Analyst", "Forward Deployed Engineer", "Forward Deployed Strategist",
    "Solutions Engineer", "AI Implementation Strategist", "Strategy & Operations Analyst", "Solutions Consultant",
  ],
  targetIndustries: [
    "Multifamily Real Estate", "Commercial Real Estate", "Real Estate Private Equity",
    "Real Estate Lending", "Capital Markets", "Development", "PropTech",
    "AI-Enabled Businesses", "Applied AI Software", "Enterprise Technology",
    "Corporate Strategy", "Strategy & Operations", "Business Intelligence",
  ],
  preferredAssetClasses: {
    primary: ["Multifamily"],
    secondary: ["Mixed-Use", "Retail", "Development", "Industrial", "Hospitality"],
  },
  companyTypes: [
    "Multifamily Owner-Operators", "Developers", "REPE Firms", "Lending Platforms",
    "Debt Funds", "Capital Markets Firms", "PropTech Companies", "AI-Enabled Real Estate Businesses",
  ],
  dealBreakers: [
    "Pure corporate finance unrelated to real estate",
    "Roles with little analytical responsibility",
    "Roles with no exposure to deals or capital allocation",
    "Dead-end operational roles with limited advancement",
    "Companies with weak culture or poor learning opportunities",
  ],
  strengths: [
    "Driven", "Competitive", "Strong networking ability", "Strategic thinker",
    "Entrepreneurial mindset", "Relationship builder", "Curious learner", "Ownership mentality",
    "Pattern recognition", "Information synthesis", "Accountability", "Strong communication skills",
  ],
  experience: [
    "Summer 2026 Yardi Internship",
    "Secure Net Lease capital markets / brokerage experience",
    "Peak Development Partners development experience",
    "IFC Rho Gamma",
    "Greek Week Director",
  ],
  projects: ["Multifamily Deal Analyzer", "Dealstash", "AI-Powered Real Estate Tools"],
  technicalSkills: [
    "Excel", "Financial Modeling", "AI Tools", "ChatGPT", "Claude", "Codex",
    "Next.js", "Supabase", "Basic SQL", "Product Development", "CRM Design", "Automation Workflows",
  ],
  realEstateSkills: [
    "Market Research", "Site Selection", "Property Research", "OM Analysis", "Basic Underwriting",
    "Capital Markets Exposure", "Development Exposure", "Broker Outreach", "Deal Screening", "Investment Research",
  ],
  aiProptechInterests: [
    "AI Deal Screening", "Investment Memo Automation", "Competitive Intelligence",
    "Business Intelligence", "Workflow Automation", "Market Research Automation",
    "Real Estate Data Platforms", "AI-Enabled Investing", "Decision Support Systems", "PropTech",
  ],
  strategyInterests: [
    "Competitive Intelligence", "Business Strategy", "Information Gathering", "Decision Making Under Uncertainty",
    "Capital Allocation", "Market Analysis", "Intelligence Methodologies", "Corporate Strategy",
  ],
  networkingStyle: {
    prefers: [
      "Relationship-first informational interviews", "Long-term relationship building",
      "Industry mentorship", "Analyst / Associate outreach", "Operator-focused conversations",
    ],
    avoids: ["Mass networking", "Transactional outreach"],
  },
  idealFirmSize: [
    "Tier 1: 50-500 employees",
    "Tier 2: 500+ employees with elite training",
    "Open to smaller firms with meaningful acquisitions, development, investing, or lending exposure",
  ],
  compensationPhilosophy: "Learning, network, and deal exposure are more important than maximizing first-year compensation.",
  workAuthorization: "U.S. Citizen",
  longTermGoal: "Build and own a large multifamily portfolio with a small, highly leveraged team.",
  careerThesis: "Become an AI-enabled real estate investor and operator who combines investing, strategy, technology, intelligence gathering, relationship building, and capital allocation.",
  targetCareerPaths: [
    "Multifamily Acquisitions / Investments",
    "Lending / Capital Markets",
    "Development",
    "Real Estate Technology / PropTech",
    "AI + Real Estate Strategy",
    "Forward Deployed Engineering / AI Solutions",
    "Forward Deployed Strategy / Strategy & Operations",
    "Corporate Strategy / Competitive Intelligence",
  ],
  northStar: "Become the person who consistently has better information, makes better decisions, and allocates capital better than competitors.",
};

export const defaultOpportunityCriteria = {
  opportunity_type: "Full-time 2027 new graduate role, analyst or rotational program, Forward Deployed role, strategy role, or solutions role",
  career_path: "Acquisitions / Investments, Lending / Capital Markets, Development, PropTech / AI real estate, Forward Deployed Engineering / AI Solutions, Forward Deployed Strategy, Strategy & Operations",
  target_roles: careerProfile.targetRoles.join(", "),
  target_markets: [...careerProfile.targetLocations, ...careerProfile.secondaryLocations].join(", "),
  asset_classes: `Primary: ${careerProfile.preferredAssetClasses.primary.join(", ")}. Secondary: ${careerProfile.preferredAssetClasses.secondary.join(", ")}.`,
  company_types: careerProfile.companyTypes.join(", "),
  target_timing: "Full-time roles starting in Spring 2027 or Summer 2027 only. Prioritize 2027 new graduate programs, analyst roles, Forward Deployed roles, strategy roles, and other permanent early-career positions. Exclude every internship, Summer Analyst internship, co-op, temporary role, part-time role, student program, and immediate 2026 start.",
  must_haves: "Full-time permanent employment, Spring/Summer 2027 timing, early-career friendly, analytical or technical responsibility, exposure to deals, capital allocation, applied AI delivery, customer problem solving, or strategic execution, strong mentorship, strong culture, learning curve, relationship-building upside.",
  avoid: careerProfile.dealBreakers.join(", "),
};

export function careerProfilePrompt() {
  return `Candidate profile:
Name: ${careerProfile.name}
School: ${careerProfile.school}, ${careerProfile.degree}, minor in ${careerProfile.minor}
Graduation: ${careerProfile.graduation}
Current context: ${careerProfile.currentLocation}
Target locations: ${careerProfile.targetLocations.join(", ")}; secondary: ${careerProfile.secondaryLocations.join(", ")}
Target roles: ${careerProfile.targetRoles.join(", ")}
Target industries: ${careerProfile.targetIndustries.join(", ")}
Primary asset class: ${careerProfile.preferredAssetClasses.primary.join(", ")}
Secondary asset classes: ${careerProfile.preferredAssetClasses.secondary.join(", ")}
Company types: ${careerProfile.companyTypes.join(", ")}
Long-term goal: ${careerProfile.longTermGoal}
Career thesis: ${careerProfile.careerThesis}
North star: ${careerProfile.northStar}
Ranked career paths: ${careerProfile.targetCareerPaths.join(" > ")}
Strengths: ${careerProfile.strengths.join(", ")}
Experience: ${careerProfile.experience.join(", ")}
Projects: ${careerProfile.projects.join(", ")}
Technical skills: ${careerProfile.technicalSkills.join(", ")}
Real estate skills: ${careerProfile.realEstateSkills.join(", ")}
AI / PropTech interests: ${careerProfile.aiProptechInterests.join(", ")}
Strategy / intelligence interests: ${careerProfile.strategyInterests.join(", ")}
Networking style: ${careerProfile.networkingStyle.prefers.join(", ")}. Avoids ${careerProfile.networkingStyle.avoids.join(", ")}.
Ideal firm size: ${careerProfile.idealFirmSize.join("; ")}
Compensation philosophy: ${careerProfile.compensationPhilosophy}
Work authorization: ${careerProfile.workAuthorization}
Deal-breakers: ${careerProfile.dealBreakers.join(", ")}`;
}

