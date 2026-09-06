export interface SchoolProfile {
  schoolId: string;
  name: string;
  officialAcceptanceRate: number; // approximate, from official source
  acceptanceRateSourceYear: string;
  sat25th?: number;
  sat75th?: number;
  actAvailable?: boolean;
  act25th?: number;
  act75th?: number;
  avgEnrolledGpaUnweighted?: number;
  cdsFactorWeights?: Record<string, string>;
  sourceUrl: string;
  notes?: string;
  // Preserved institutional metadata
  category?: 'reach' | 'target' | 'safety';
  matchScore?: number;
  location?: string;
  deadline?: string;
  round?: string;
  whyFit?: string | ((major: string) => string);
  keyFactor?: string;
  strengthAlignment?: 'very_high' | 'high' | 'moderate';
  region?: 'us' | 'uk' | 'canada';
}

/**
 * Verified institutional profiles.
 * Features official Common Data Set (CDS) entries for benchmark institutions,
 * alongside tracked institutional placeholders awaiting CDS verification.
 */
export const SCHOOL_PROFILES: SchoolProfile[] = [
  // ==========================================
  // REAL EXAMPLE 1: MIT (Verified CDS 2023-2024)
  // ==========================================
  {
    schoolId: 'rec-mit',
    name: 'Massachusetts Institute of Technology (MIT)',
    officialAcceptanceRate: 3.96,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1520,
    sat75th: 1580,
    actAvailable: true,
    act25th: 35,
    act75th: 36,
    avgEnrolledGpaUnweighted: 3.98,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Standardized test scores': 'Very Important',
      'Application Essay': 'Very Important',
      'Recommendation': 'Very Important',
      'Character/Personal Qualities': 'Very Important',
      'Extracurricular Activities': 'Very Important',
      'Talent/Ability': 'Very Important',
      'Interview': 'Considered',
      'First generation': 'Considered',
      'Volunteer work': 'Considered'
    },
    sourceUrl: 'https://ir.mit.edu/cds-2023-24',
    notes: 'Standardized tests required (SAT or ACT). Holistic review evaluating deep quantitative mastery, maker initiative, and alignment with MIT mission.',
    category: 'reach',
    matchScore: 96,
    location: 'Cambridge, MA, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: (major: string) =>
      `World-leading computing & engineering labs aligned with your ${major.toUpperCase()} portfolio. Evaluates deep mathematical problem solving and distinctive maker spike.`,
    keyFactor: 'STEM project portfolio, Olympiad/research depth, and math/science recommendation letters.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  // ==============================================
  // REAL EXAMPLE 2: Stanford (Verified CDS 2023-2024)
  // ==============================================
  {
    schoolId: 'rec-stanford',
    name: 'Stanford University',
    officialAcceptanceRate: 3.68,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1500,
    sat75th: 1580,
    actAvailable: true,
    act25th: 34,
    act75th: 36,
    avgEnrolledGpaUnweighted: 3.96,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Standardized test scores': 'Very Important',
      'Application Essay': 'Very Important',
      'Recommendation': 'Very Important',
      'Extracurricular Activities': 'Very Important',
      'Talent/Ability': 'Very Important',
      'Character/Personal Qualities': 'Very Important',
      'Interview': 'Considered',
      'First generation': 'Considered'
    },
    sourceUrl: 'https://ucomm.stanford.edu/cds/2023-2024',
    notes: 'Holistic review placing extraordinary weight on intellectual vitality and authentic character.',
    category: 'reach',
    matchScore: 94,
    location: 'Stanford, CA, USA',
    deadline: 'Nov 1',
    round: 'Restrictive Early Action (REA)',
    whyFit: 'Silicon Valley proximity and interdisciplinary tech-innovation culture.',
    keyFactor: 'Intellectual vitality essay and distinctive extracurricular leadership.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  // =========================================================================
  // UNITED STATES INSTITUTIONS (Placeholders awaiting verified CDS ingestion)
  // =========================================================================

  // TODO: verify from official CDS
  {
    schoolId: 'rec-cmu',
    name: 'Carnegie Mellon University (SCS)',
    officialAcceptanceRate: 7.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1510,
    sat75th: 1570,
    actAvailable: true,
    act25th: 34,
    act75th: 36,
    avgEnrolledGpaUnweighted: 3.95,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Standardized test scores': 'Very Important',
      'Extracurricular Activities': 'Very Important'
    },
    sourceUrl: 'https://www.cmu.edu/ira/CDS/index.html',
    notes: 'Premier pure computing and engineering curriculum with direct department admission.',
    category: 'reach',
    matchScore: 95,
    location: 'Pittsburgh, PA, USA',
    deadline: 'Jan 3',
    round: 'Regular Decision (RD)',
    whyFit: 'Premier pure computing and engineering curriculum with direct department admission.',
    keyFactor: 'Advanced math proficiency and coding project depth.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-umich',
    name: 'University of Michigan',
    officialAcceptanceRate: 17.7,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1360,
    sat75th: 1530,
    actAvailable: true,
    act25th: 31,
    act75th: 35,
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Character/Personal Qualities': 'Very Important'
    },
    sourceUrl: 'https://obp.umich.edu/campus-statistics/common-data-set/',
    notes: 'High rigor public research university; out-of-state pool is exceptionally competitive.',
    category: 'target',
    matchScore: 92,
    location: 'Ann Arbor, MI, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: (major: string) =>
      `World-class academic powerhouse for ${major.toUpperCase()}. Highly competitive out-of-state and international admissions pool.`,
    keyFactor: 'Demonstrated rigor in advanced math/science and compelling Community Contribution essay.',
    strengthAlignment: 'high',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-gatech',
    name: 'Georgia Institute of Technology',
    officialAcceptanceRate: 15.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1380,
    sat75th: 1540,
    actAvailable: true,
    act25th: 31,
    act75th: 35,
    avgEnrolledGpaUnweighted: 3.91,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Very Important'
    },
    sourceUrl: 'https://irp.gatech.edu/common-data-set',
    notes: 'Technological institute requiring rigorous math/science background and hands-on portfolio.',
    category: 'reach',
    matchScore: 93,
    location: 'Atlanta, GA, USA',
    deadline: 'Oct 15',
    round: 'Early Action 1 (EA1)',
    whyFit: 'Premier technological research institute with stellar co-op opportunities.',
    keyFactor: 'Demonstrated quantitative excellence and applied engineering initiatives.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-purdue',
    name: 'Purdue University',
    officialAcceptanceRate: 50.3,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1210,
    sat75th: 1470,
    actAvailable: true,
    act25th: 27,
    act75th: 34,
    avgEnrolledGpaUnweighted: 3.78,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Standardized test scores': 'Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://www.purdue.edu/datadigest/',
    notes: 'Applying by the Nov 1 Early Action priority deadline is crucial for competitive STEM majors.',
    category: 'target',
    matchScore: 92,
    location: 'West Lafayette, IN, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: 'World-renowned engineering and STEM programs with strong global ROI and industry placement.',
    keyFactor: 'Applying by Nov 1 Early Action priority deadline is strictly essential.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-uiuc',
    name: 'University of Illinois Urbana-Champaign (UIUC)',
    officialAcceptanceRate: 28.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1340,
    sat75th: 1530,
    actAvailable: true,
    act25th: 29,
    act75th: 34,
    avgEnrolledGpaUnweighted: 3.85,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://dmi.illinois.edu/stuenr.htm',
    notes: 'Direct-to-major admission for Grainger Engineering and computer science majors.',
    category: 'target',
    matchScore: 91,
    location: 'Urbana, IL, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: 'Superb departmental faculty and vast computing infrastructure.',
    keyFactor: 'Direct-to-major essay specificity and balanced quantitative coursework.',
    strengthAlignment: 'high',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-pennstate',
    name: 'Penn State University',
    officialAcceptanceRate: 55.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1160,
    sat75th: 1370,
    actAvailable: true,
    act25th: 26,
    act75th: 31,
    avgEnrolledGpaUnweighted: 3.65,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important'
    },
    sourceUrl: 'https://opair.psu.edu/institutional-research/common-data-set/',
    notes: 'Large Big Ten research campus with substantial engineering and agricultural colleges.',
    category: 'target',
    matchScore: 84,
    location: 'University Park, PA, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: (major: string) =>
      `Prominent Big Ten research institution. Offers strong resources and industry recruitment in ${major.toUpperCase()}.`,
    keyFactor: 'Consistent senior-year grades and applying early to the main University Park campus.',
    strengthAlignment: 'moderate',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-msu',
    name: 'Michigan State University',
    officialAcceptanceRate: 88.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1100,
    sat75th: 1320,
    actAvailable: true,
    act25th: 23,
    act75th: 29,
    avgEnrolledGpaUnweighted: 3.62,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important'
    },
    sourceUrl: 'https://opb.msu.edu/functions/institution/cds.html',
    notes: 'Accessible Big Ten research university with honors college pathways.',
    category: 'safety',
    matchScore: 86,
    location: 'East Lansing, MI, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: 'Top-tier undergraduate resources, extensive international support, and broad major flexibility.',
    keyFactor: 'Early application submission and meeting core high school coursework distribution.',
    strengthAlignment: 'high',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-asu',
    name: 'Arizona State University (ASU)',
    officialAcceptanceRate: 89.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1120,
    sat75th: 1360,
    actAvailable: true,
    act25th: 22,
    act75th: 29,
    avgEnrolledGpaUnweighted: 3.54,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important'
    },
    sourceUrl: 'https://uoia.asu.edu/data/common-data-set',
    notes: 'Assured admissions criteria based on unweighted core GPA and course competency.',
    category: 'safety',
    matchScore: 90,
    location: 'Tempe, AZ, USA',
    deadline: 'Rolling',
    round: 'Rolling Admission',
    whyFit: '#1 in Innovation with high-capacity engineering and business programs, welcoming diverse academic trajectories.',
    keyFactor: 'Meeting standard competency requirements in math and laboratory sciences.',
    strengthAlignment: 'high',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-oregonstate',
    name: 'Oregon State University',
    officialAcceptanceRate: 82.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1080,
    sat75th: 1320,
    actAvailable: true,
    act25th: 21,
    act75th: 28,
    avgEnrolledGpaUnweighted: 3.61,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important'
    },
    sourceUrl: 'https://institutionalresearch.oregonstate.edu/common-data-set',
    notes: 'Strong Pacific Northwest STEM and forestry research institution.',
    category: 'safety',
    matchScore: 87,
    location: 'Corvallis, OR, USA',
    deadline: 'Feb 1',
    round: 'Regular Decision',
    whyFit: 'Respected research university with strong STEM pathways and practical co-op experiences.',
    keyFactor: 'Demonstrated interest and completion of high school graduation prerequisites.',
    strengthAlignment: 'high',
    region: 'us'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-uta',
    name: 'University of Texas at Arlington (UTA)',
    officialAcceptanceRate: 93.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1040,
    sat75th: 1260,
    actAvailable: true,
    act25th: 20,
    act75th: 26,
    avgEnrolledGpaUnweighted: 3.48,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important'
    },
    sourceUrl: 'https://www.uta.edu/analytics/common-data-set',
    notes: 'Carnegie R1 high research activity in Dallas-Fort Worth metro area with accessible criteria.',
    category: 'safety',
    matchScore: 89,
    location: 'Arlington, TX, USA',
    deadline: 'Rolling',
    round: 'Rolling Admission',
    whyFit: 'High-access Carnegie R1 research university in the Dallas-Fort Worth metroplex with very favorable tuition and admission rates.',
    keyFactor: 'Direct submission of transcripts and English proficiency proof.',
    strengthAlignment: 'high',
    region: 'us'
  },

  // =========================================================================
  // UNITED STATES — EXTENDED COVERAGE
  // =========================================================================

  {
    schoolId: 'rec-cornell',
    name: 'Cornell University',
    officialAcceptanceRate: 8.7,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1450,
    sat75th: 1560,
    actAvailable: true,
    act25th: 34,
    act75th: 36,
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Recommendation': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://irp.cornell.edu/our-university/institutional-research/common-data-set',
    notes: 'Ivy League with direct-to-college admissions; each school (Engineering, Arts & Sciences, etc.) has its own standards.',
    category: 'reach',
    matchScore: 94,
    location: 'Ithaca, NY, USA',
    deadline: 'Nov 1',
    round: 'Early Decision (ED)',
    whyFit: (major: string) =>
      `Ivy League depth with world-class ${major.toUpperCase()} faculty and strong industry recruiting pipelines in NYC and Silicon Valley.`,
    keyFactor: 'College-specific essays, rigor of senior-year coursework, and letters of recommendation.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  {
    schoolId: 'rec-northwestern',
    name: 'Northwestern University',
    officialAcceptanceRate: 6.8,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1500,
    sat75th: 1570,
    actAvailable: true,
    act25th: 34,
    act75th: 36,
    avgEnrolledGpaUnweighted: 3.92,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Very Important',
      'Character/Personal Qualities': 'Very Important'
    },
    sourceUrl: 'https://www.northwestern.edu/institutional-research/data-and-statistics/common-data-set.html',
    notes: 'Highly interdisciplinary with strong emphasis on research, entrepreneurship, and the Weinberg Core.',
    category: 'reach',
    matchScore: 95,
    location: 'Evanston, IL, USA',
    deadline: 'Nov 1',
    round: 'Early Decision (ED)',
    whyFit: (major: string) =>
      `Top-tier interdisciplinary research environment. ${major.toUpperCase()} students benefit from McCormick School of Engineering and Kellogg proximity.`,
    keyFactor: '"Why Northwestern" supplemental essay depth and demonstrated intellectual curiosity.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  {
    schoolId: 'rec-duke',
    name: 'Duke University',
    officialAcceptanceRate: 6.1,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1510,
    sat75th: 1570,
    actAvailable: true,
    act25th: 34,
    act75th: 36,
    avgEnrolledGpaUnweighted: 3.92,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Very Important',
      'Character/Personal Qualities': 'Very Important'
    },
    sourceUrl: 'https://ir.duke.edu/common-data-set',
    notes: 'Strong emphasis on authentic passion, research engagement, and Duke-specific community fit.',
    category: 'reach',
    matchScore: 95,
    location: 'Durham, NC, USA',
    deadline: 'Nov 1',
    round: 'Early Decision (ED)',
    whyFit: (major: string) =>
      `Research-forward culture with exceptional ${major.toUpperCase()} resources and close-knit undergraduate community.`,
    keyFactor: 'Authentic passion demonstrated through sustained EC commitment and strong supplemental essays.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  {
    schoolId: 'rec-jhu',
    name: 'Johns Hopkins University',
    officialAcceptanceRate: 6.8,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1510,
    sat75th: 1580,
    actAvailable: true,
    act25th: 34,
    act75th: 36,
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Very Important'
    },
    sourceUrl: 'https://oir.jhu.edu/common-data-set/',
    notes: 'Premier research university — undergraduate research culture is core to identity.',
    category: 'reach',
    matchScore: 95,
    location: 'Baltimore, MD, USA',
    deadline: 'Nov 1',
    round: 'Early Decision (ED)',
    whyFit: (major: string) =>
      `World #1 in research output with deep ${major.toUpperCase()} lab access and a culture of undergraduate intellectual independence.`,
    keyFactor: 'Demonstrated independent research or project initiative and compelling academic narrative.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  {
    schoolId: 'rec-northeastern',
    name: 'Northeastern University',
    officialAcceptanceRate: 6.7,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1490,
    sat75th: 1560,
    actAvailable: true,
    act25th: 34,
    act75th: 36,
    avgEnrolledGpaUnweighted: 3.89,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://www.northeastern.edu/institutional-research-analytics/common-data-set/',
    notes: 'Famous cooperative education (co-op) program placing students in industry every 6 months.',
    category: 'reach',
    matchScore: 93,
    location: 'Boston, MA, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: (major: string) =>
      `World-renowned co-op program embeds ${major.toUpperCase()} students directly in top-tier companies, providing unmatched pre-graduation industry experience.`,
    keyFactor: 'Demonstrated career intentionality and professional initiative in extracurriculars.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  {
    schoolId: 'rec-ucla',
    name: 'University of California, Los Angeles (UCLA)',
    officialAcceptanceRate: 8.8,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1290,
    sat75th: 1530,
    actAvailable: true,
    act25th: 29,
    act75th: 35,
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://apb.ucla.edu/campus-statistics/common-data-set',
    notes: 'Holistic review via 8 Personal Insight Questions; GPA calculated by UC system scale.',
    category: 'reach',
    matchScore: 94,
    location: 'Los Angeles, CA, USA',
    deadline: 'Nov 30',
    round: 'UC Application Deadline',
    whyFit: (major: string) =>
      `Top-ranked public university with world-class ${major.toUpperCase()} faculty, Silicon Beach proximity, and massive alumni network.`,
    keyFactor: '8 UC Personal Insight Questions — depth, authenticity, and evidence of impact.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  {
    schoolId: 'rec-ucberkeley',
    name: 'University of California, Berkeley (UC Berkeley)',
    officialAcceptanceRate: 11.4,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1310,
    sat75th: 1530,
    actAvailable: true,
    act25th: 29,
    act75th: 35,
    avgEnrolledGpaUnweighted: 3.89,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://opa.berkeley.edu/uc-common-data-set',
    notes: 'CS and EECS admissions are highly selective within the College of Engineering. UC GPA scale applies.',
    category: 'reach',
    matchScore: 95,
    location: 'Berkeley, CA, USA',
    deadline: 'Nov 30',
    round: 'UC Application Deadline',
    whyFit: (major: string) =>
      `#1 public university globally with legendary ${major.toUpperCase()} programs and direct Silicon Valley recruiting access.`,
    keyFactor: 'Demonstrated intellectual depth in relevant coursework and high-impact EC narrative.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  {
    schoolId: 'rec-nyu',
    name: 'New York University (NYU)',
    officialAcceptanceRate: 12.2,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1390,
    sat75th: 1550,
    actAvailable: true,
    act25th: 31,
    act75th: 35,
    avgEnrolledGpaUnweighted: 3.70,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://www.nyu.edu/about/leadership-university-administration/office-of-the-president/office-of-the-provost/institutional-research.html',
    notes: 'Global campus network; NYC location is a prime recruiting hub for finance, media, and tech.',
    category: 'reach',
    matchScore: 91,
    location: 'New York, NY, USA',
    deadline: 'Nov 1',
    round: 'Early Decision (ED)',
    whyFit: (major: string) =>
      `Globally networked university at the heart of NYC's tech and finance ecosystem — ideal for ${major.toUpperCase()} students seeking immediate industry exposure.`,
    keyFactor: 'Compelling personal narrative and demonstrated interest in NYC industry ecosystem.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-bu',
    name: 'Boston University',
    officialAcceptanceRate: 14.3,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1410,
    sat75th: 1540,
    actAvailable: true,
    act25th: 32,
    act75th: 35,
    avgEnrolledGpaUnweighted: 3.78,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://www.bu.edu/oir/files/2024/02/CDS-2023-2024.pdf',
    notes: 'Large research university in Boston with strong co-op and entrepreneurship culture.',
    category: 'reach',
    matchScore: 89,
    location: 'Boston, MA, USA',
    deadline: 'Nov 1',
    round: 'Early Decision (ED)',
    whyFit: (major: string) =>
      `Strong ${major.toUpperCase()} programs in the heart of the Boston innovation corridor with deep biotech and tech employer connections.`,
    keyFactor: 'Rigorous senior-year course load and a specific, authentic "Why BU" essay.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-unc',
    name: 'University of North Carolina at Chapel Hill',
    officialAcceptanceRate: 19.2,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1330,
    sat75th: 1520,
    actAvailable: true,
    act25th: 30,
    act75th: 35,
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://oira.unc.edu/data/common-data-set/',
    notes: 'Highly competitive for out-of-state applicants; in-state acceptance rate significantly higher.',
    category: 'reach',
    matchScore: 90,
    location: 'Chapel Hill, NC, USA',
    deadline: 'Oct 15',
    round: 'Early Action (EA)',
    whyFit: (major: string) =>
      `Top-ranked public university with a strong ${major.toUpperCase()} research pedigree and vibrant Research Triangle ecosystem.`,
    keyFactor: 'Out-of-state applicants must demonstrate extraordinary achievement and clear fit.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-ucsd',
    name: 'University of California, San Diego (UCSD)',
    officialAcceptanceRate: 24.3,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1290,
    sat75th: 1500,
    actAvailable: true,
    act25th: 28,
    act75th: 34,
    avgEnrolledGpaUnweighted: 3.87,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important'
    },
    sourceUrl: 'https://ir.ucsd.edu/undergrad/publications/common-data-set.html',
    notes: 'Top CS and engineering school with deep biotech and defense-tech research infrastructure.',
    category: 'target',
    matchScore: 92,
    location: 'La Jolla, CA, USA',
    deadline: 'Nov 30',
    round: 'UC Application Deadline',
    whyFit: (major: string) =>
      `Tier-1 research university for ${major.toUpperCase()} with proximity to San Diego's thriving biotech and tech industry hubs.`,
    keyFactor: 'UC Personal Insight Questions showing depth of academic initiative and community impact.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-uva',
    name: 'University of Virginia (UVA)',
    officialAcceptanceRate: 20.6,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1350,
    sat75th: 1520,
    actAvailable: true,
    act25th: 31,
    act75th: 35,
    avgEnrolledGpaUnweighted: 3.91,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://ira.virginia.edu/university-stats-facts/common-data-set',
    notes: 'Highly competitive for out-of-state applicants; strong honor culture and self-governance tradition.',
    category: 'target',
    matchScore: 91,
    location: 'Charlottesville, VA, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: (major: string) =>
      `Prestigious public flagship with strong ${major.toUpperCase()} programs and a powerful DC/Northern Virginia tech recruiting corridor.`,
    keyFactor: '"Why UVA" essay specificity and demonstrated intellectual engagement.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-uwmadison',
    name: 'University of Wisconsin-Madison',
    officialAcceptanceRate: 49.1,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1290,
    sat75th: 1480,
    actAvailable: true,
    act25th: 27,
    act75th: 33,
    avgEnrolledGpaUnweighted: 3.76,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://data.wisc.edu/common-data-set/',
    notes: 'Major Big Ten research university with particularly competitive direct CS admissions.',
    category: 'target',
    matchScore: 90,
    location: 'Madison, WI, USA',
    deadline: 'Feb 1',
    round: 'Regular Decision',
    whyFit: (major: string) =>
      `Top-ranked Big Ten research institution with exceptional ${major.toUpperCase()} faculty and strong Midwest tech employer network.`,
    keyFactor: 'Strong academic record and compelling essay demonstrating research or project initiative.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-umd',
    name: 'University of Maryland, College Park',
    officialAcceptanceRate: 44.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1310,
    sat75th: 1500,
    actAvailable: true,
    act25th: 30,
    act75th: 34,
    avgEnrolledGpaUnweighted: 3.88,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://irpa.umd.edu/CDS/cds.html',
    notes: 'Flagship public near Washington DC with top CS program and strong government/federal tech recruiting.',
    category: 'target',
    matchScore: 90,
    location: 'College Park, MD, USA',
    deadline: 'Nov 1',
    round: 'Early Action (EA)',
    whyFit: (major: string) =>
      `Flagship public near DC with a top-5 CS program and unmatched access to federal agencies, defense contractors, and government tech opportunities.`,
    keyFactor: 'Direct-to-major CS application requires a strong quantitative profile and technical essay.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-utaustin',
    name: 'University of Texas at Austin (UT Austin)',
    officialAcceptanceRate: 29.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1230,
    sat75th: 1490,
    actAvailable: true,
    act25th: 27,
    act75th: 34,
    avgEnrolledGpaUnweighted: 3.73,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important'
    },
    sourceUrl: 'https://reports.irris.utexas.edu/common_data_set',
    notes: 'CS admission is significantly more competitive than the overall rate; top 6% TX automatic admission applies.',
    category: 'target',
    matchScore: 91,
    location: 'Austin, TX, USA',
    deadline: 'Dec 1',
    round: 'Regular Decision',
    whyFit: (major: string) =>
      `Premier public flagship in Austin's booming tech scene. ${major.toUpperCase()} graduates are heavily recruited by Tesla, Apple, Google, and Meta offices in Austin.`,
    keyFactor: 'Essays demonstrating leadership and community impact are weighted heavily.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-umn',
    name: 'University of Minnesota, Twin Cities',
    officialAcceptanceRate: 58.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1230,
    sat75th: 1480,
    actAvailable: true,
    act25th: 26,
    act75th: 32,
    avgEnrolledGpaUnweighted: 3.70,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://idr.umn.edu/institutional-data/common-data-set',
    notes: 'Large Big Ten research university with extensive co-op and industry partnership programs.',
    category: 'safety',
    matchScore: 86,
    location: 'Minneapolis, MN, USA',
    deadline: 'Rolling',
    round: 'Rolling Admission',
    whyFit: (major: string) =>
      `Major Big Ten research university with strong ${major.toUpperCase()} programs, accessible admissions, and robust career placement in the Twin Cities tech market.`,
    keyFactor: 'Meeting academic thresholds and submitting early in the rolling window.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-rutgers',
    name: 'Rutgers University-New Brunswick',
    officialAcceptanceRate: 66.0,
    acceptanceRateSourceYear: '2023-2024',
    sat25th: 1200,
    sat75th: 1430,
    actAvailable: true,
    act25th: 26,
    act75th: 31,
    avgEnrolledGpaUnweighted: 3.72,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important'
    },
    sourceUrl: 'https://www.rutgers.edu/institutional-research-and-academic-planning',
    notes: 'Large state flagship in the NYC metro area with accessible admissions and strong pharma/tech industry ties.',
    category: 'safety',
    matchScore: 85,
    location: 'New Brunswick, NJ, USA',
    deadline: 'Dec 1',
    round: 'Regular Decision',
    whyFit: (major: string) =>
      `NJ flagship with strong ${major.toUpperCase()} programs and proximity to NYC's finance, pharma, and tech recruiting hubs.`,
    keyFactor: 'Solid academic record and early submission for merit scholarship consideration.',
    strengthAlignment: 'high',
    region: 'us'
  },

  // =========================================================================
  // UNITED KINGDOM INSTITUTIONS (Placeholders awaiting verified CDS ingestion)
  // =========================================================================

  // TODO: verify from official CDS
  {
    schoolId: 'rec-oxford',
    name: 'University of Oxford',
    officialAcceptanceRate: 14.5,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Admissions Test (MAT/PAT/TSA)': 'Very Important',
      'Academic Interview': 'Very Important'
    },
    sourceUrl: 'https://www.ox.ac.uk/about/facts-and-figures/admissions-statistics',
    notes: 'Tutorial pedagogy requiring top-percentile subject mastery, admissions assessment, and faculty interview.',
    category: 'reach',
    matchScore: 96,
    location: 'Oxford, United Kingdom',
    deadline: 'Oct 15',
    round: 'UCAS Deadline',
    whyFit: (major: string) =>
      `World-leading tutorial pedagogy in ${major.toUpperCase()}. Demands top-percentile subject mastery and admissions test scores.`,
    keyFactor: 'Oxbridge admissions test (MAT/PAT/TSA) score and rigorous academic interview.',
    strengthAlignment: 'very_high',
    region: 'uk'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-cambridge',
    name: 'University of Cambridge',
    officialAcceptanceRate: 15.7,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Subject Written Assessment': 'Very Important',
      'Academic Interview': 'Very Important'
    },
    sourceUrl: 'https://www.undergraduate.study.cam.ac.uk/apply/statistics',
    notes: 'Supervision system emphasizing deep mathematical and logical problem solving from day one.',
    category: 'reach',
    matchScore: 95,
    location: 'Cambridge, United Kingdom',
    deadline: 'Oct 15',
    round: 'UCAS Deadline',
    whyFit: 'Premier academic supervision system and direct subject focus from matriculation.',
    keyFactor: 'Subject-specific written assessment and mathematical problem-solving depth.',
    strengthAlignment: 'very_high',
    region: 'uk'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-ucl',
    name: 'University College London (UCL)',
    officialAcceptanceRate: 29.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important'
    },
    sourceUrl: 'https://www.ucl.ac.uk/data-protection/data-protection-overview/ucl-student-data',
    notes: 'Global top 10 university with rich interdisciplinary research centers in central London.',
    category: 'target',
    matchScore: 91,
    location: 'London, United Kingdom',
    deadline: 'Jan 31',
    round: 'UCAS Standard',
    whyFit: 'Global top 10 university with rich interdisciplinary research centers.',
    keyFactor: 'UCAS Personal Statement academic alignment and IELTS score clearance.',
    strengthAlignment: 'high',
    region: 'uk'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-edinburgh',
    name: 'University of Edinburgh',
    officialAcceptanceRate: 33.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important'
    },
    sourceUrl: 'https://www.ed.ac.uk/student-recruitment/admissions-statistics',
    notes: '4-year Scottish curriculum allowing broad flexibility before honors specialization.',
    category: 'target',
    matchScore: 89,
    location: 'Edinburgh, Scotland',
    deadline: 'Jan 31',
    round: 'UCAS Standard',
    whyFit: '4-year Scottish honors system allowing broader academic exploration.',
    keyFactor: 'Consistent high school transcript and subject prerequisite grades.',
    strengthAlignment: 'high',
    region: 'uk'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-manchester',
    name: 'University of Manchester',
    officialAcceptanceRate: 56.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important'
    },
    sourceUrl: 'https://www.manchester.ac.uk/discover/facts-figures/',
    notes: 'Prestigious Russell Group university with high international student representation.',
    category: 'safety',
    matchScore: 87,
    location: 'Manchester, United Kingdom',
    deadline: 'Jan 31',
    round: 'UCAS Standard',
    whyFit: (major: string) =>
      `Prestigious Russell Group university. Fits your current academic standing while providing room for high-caliber growth in ${major.toUpperCase()}.`,
    keyFactor: 'Meeting minimum IELTS entry score and consistent year-12 subject performance.',
    strengthAlignment: 'moderate',
    region: 'uk'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-sheffield',
    name: 'University of Sheffield',
    officialAcceptanceRate: 68.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important'
    },
    sourceUrl: 'https://www.sheffield.ac.uk/about/facts',
    notes: 'Leading research institution with modern engineering facilities and direct entry schemes.',
    category: 'safety',
    matchScore: 84,
    location: 'Sheffield, UK',
    deadline: 'Jan 31',
    round: 'UCAS Standard',
    whyFit: 'Strong technical and research facilities with accessible direct conditional entry schemes.',
    keyFactor: 'UCAS Personal Statement focus and meeting subject prerequisites.',
    strengthAlignment: 'high',
    region: 'uk'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-sussex',
    name: 'University of Sussex',
    officialAcceptanceRate: 78.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important'
    },
    sourceUrl: 'https://www.sussex.ac.uk/about/facts-and-figures',
    notes: 'Supportive campus community located near Brighton with diverse degree programs.',
    category: 'target',
    matchScore: 86,
    location: 'Brighton, UK',
    deadline: 'Jan 31',
    round: 'UCAS Standard',
    whyFit: 'Solid international student community with strong industry links and accessible admissions.',
    keyFactor: 'Verified high school graduation certificate and IELTS clearance.',
    strengthAlignment: 'high',
    region: 'uk'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-portsmouth',
    name: 'University of Portsmouth',
    officialAcceptanceRate: 86.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Academic GPA': 'Very Important'
    },
    sourceUrl: 'https://www.port.ac.uk/about-us/facts-and-figures',
    notes: 'Direct conditional entry and foundation options for international students.',
    category: 'safety',
    matchScore: 88,
    location: 'Portsmouth, UK',
    deadline: 'Rolling',
    round: 'UCAS Direct',
    whyFit: 'High student satisfaction and supportive foundation/direct degree programs.',
    keyFactor: 'Standard academic completion and basic English proficiency.',
    strengthAlignment: 'high',
    region: 'uk'
  },

  // =========================================================================
  // CANADA INSTITUTIONS (Placeholders awaiting verified CDS ingestion)
  // =========================================================================

  // TODO: verify from official CDS
  {
    schoolId: 'rec-utoronto',
    name: 'University of Toronto',
    officialAcceptanceRate: 43.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Supplementary Application': 'Very Important'
    },
    sourceUrl: 'https://data.utoronto.ca/cudo/',
    notes: '#1 university in Canada with top-tier research output and substantial co-op opportunities.',
    category: 'reach',
    matchScore: 94,
    location: 'Toronto, ON, Canada',
    deadline: 'Jan 15',
    round: 'Early Consideration',
    whyFit: '#1 university in Canada with massive research output and co-op opportunities.',
    keyFactor: 'Supplementary Application video/essay response and IELTS 7.0+ standard.',
    strengthAlignment: 'very_high',
    region: 'canada'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-ubc',
    name: 'University of British Columbia (UBC)',
    officialAcceptanceRate: 52.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Personal Profile': 'Very Important'
    },
    sourceUrl: 'https://pair.ubc.ca/student-data/',
    notes: 'Personal Profile essays evaluated alongside rigorous high school coursework.',
    category: 'reach',
    matchScore: 92,
    location: 'Vancouver, BC, Canada',
    deadline: 'Jan 15',
    round: 'Standard Deadline',
    whyFit: 'Top international faculty, Pacific Rim innovation hubs, and high quality of life.',
    keyFactor: 'Personal Profile essays showcasing extracurricular engagement and leadership.',
    strengthAlignment: 'high',
    region: 'canada'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-waterloo',
    name: 'University of Waterloo',
    officialAcceptanceRate: 53.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Admission Information Form (AIF)': 'Very Important',
      'Euclid Math Contest': 'Important'
    },
    sourceUrl: 'https://uwaterloo.ca/institutional-analysis-planning/university-data',
    notes: 'World-renowned co-op program with premier software engineering recruitment.',
    category: 'target',
    matchScore: 93,
    location: 'Waterloo, ON, Canada',
    deadline: 'Feb 1',
    round: 'Standard Deadline',
    whyFit: 'World-renowned Co-Op program connecting students directly to Silicon Valley tech.',
    keyFactor: 'Admission Information Form (AIF) and Euclid Math Contest results.',
    strengthAlignment: 'very_high',
    region: 'canada'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-sfu',
    name: 'Simon Fraser University (SFU)',
    officialAcceptanceRate: 65.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important'
    },
    sourceUrl: 'https://www.sfu.ca/irp.html',
    notes: 'Solid applied computing, engineering, and business tracks across 3 Metro Vancouver campuses.',
    category: 'safety',
    matchScore: 86,
    location: 'Burnaby, BC, Canada',
    deadline: 'Jan 31',
    round: 'Standard Deadline',
    whyFit: 'Recognized Canadian institution with strong computing and business curriculum.',
    keyFactor: 'Submitting strong senior-year marks and meeting IELTS cutoff.',
    strengthAlignment: 'moderate',
    region: 'canada'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-uvic',
    name: 'University of Victoria',
    officialAcceptanceRate: 75.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Academic GPA': 'Very Important'
    },
    sourceUrl: 'https://www.uvic.ca/institutionalplanning/institutional-data/index.php',
    notes: 'Comprehensive university on Vancouver Island with supportive international student tracks.',
    category: 'target',
    matchScore: 86,
    location: 'Victoria, BC, Canada',
    deadline: 'Feb 28',
    round: 'Standard Deadline',
    whyFit: 'High student satisfaction and accessible comprehensive degree tracks.',
    keyFactor: 'Meeting general high school average requirements and IELTS clearance.',
    strengthAlignment: 'high',
    region: 'canada'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-carleton',
    name: 'Carleton University',
    officialAcceptanceRate: 82.0,
    acceptanceRateSourceYear: '2023-2024',
    cdsFactorWeights: {
      'Academic GPA': 'Very Important'
    },
    sourceUrl: 'https://carleton.ca/oirp/institutional-data/',
    notes: 'Capital city university with reliable international admissions and practical co-op programs.',
    category: 'safety',
    matchScore: 88,
    location: 'Ottawa, ON, Canada',
    deadline: 'Mar 1',
    round: 'Rolling Intake',
    whyFit: 'Capital city university with reliable international admissions and co-op options.',
    keyFactor: 'Transcripts and standard language qualification.',
    strengthAlignment: 'high',
    region: 'canada'
  }
];

export const ALL_SCHOOLS = SCHOOL_PROFILES;
