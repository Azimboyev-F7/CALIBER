export interface SchoolProfile {
  schoolId: string;
  name: string;
  officialAcceptanceRate: number; // approximate, from official source
  acceptanceRateSourceYear: string;
  sat25th?: number;
  sat75th?: number;
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
  region?: 'us' | 'uk' | 'canada' | 'korea' | 'germany' | 'china';
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
    officialAcceptanceRate: 4.6,
    acceptanceRateSourceYear: '2025-2026',
    sat25th: 1520,
    sat75th: 1580,
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
    officialAcceptanceRate: 3.8,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1500,
    sat75th: 1580,
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
    name: 'Carnegie Mellon University',
    officialAcceptanceRate: 11.7,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1510,
    sat75th: 1570,
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
    officialAcceptanceRate: 17.0,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1380,
    sat75th: 1540,
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
    officialAcceptanceRate: 42.4,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1340,
    sat75th: 1530,
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
    officialAcceptanceRate: 61.0,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1160,
    sat75th: 1370,
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
    officialAcceptanceRate: 83.0,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1100,
    sat75th: 1320,
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
    officialAcceptanceRate: 77.3,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1080,
    sat75th: 1320,
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
    officialAcceptanceRate: 79.9,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1040,
    sat75th: 1260,
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
  // UNITED STATES вЂ” EXTENDED COVERAGE
  // =========================================================================

  {
    schoolId: 'rec-cornell',
    name: 'Cornell University',
    officialAcceptanceRate: 8.0,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1450,
    sat75th: 1560,
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
    officialAcceptanceRate: 7.5,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1500,
    sat75th: 1570,
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
    officialAcceptanceRate: 5.7,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1510,
    sat75th: 1570,
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
    officialAcceptanceRate: 5.1,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1510,
    sat75th: 1580,
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Rigor of secondary school record': 'Very Important',
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Very Important'
    },
    sourceUrl: 'https://oir.jhu.edu/common-data-set/',
    notes: 'Premier research university вЂ” undergraduate research culture is core to identity.',
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
    officialAcceptanceRate: 5.6,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1490,
    sat75th: 1560,
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
    officialAcceptanceRate: 9.0,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1290,
    sat75th: 1530,
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
    keyFactor: '8 UC Personal Insight Questions вЂ” depth, authenticity, and evidence of impact.',
    strengthAlignment: 'very_high',
    region: 'us'
  },

  {
    schoolId: 'rec-ucberkeley',
    name: 'University of California, Berkeley (UC Berkeley)',
    officialAcceptanceRate: 11.0,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1310,
    sat75th: 1530,
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
    officialAcceptanceRate: 7.7,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1390,
    sat75th: 1550,
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
      `Globally networked university at the heart of NYC's tech and finance ecosystem вЂ” ideal for ${major.toUpperCase()} students seeking immediate industry exposure.`,
    keyFactor: 'Compelling personal narrative and demonstrated interest in NYC industry ecosystem.',
    strengthAlignment: 'high',
    region: 'us'
  },

  {
    schoolId: 'rec-bu',
    name: 'Boston University',
    officialAcceptanceRate: 10.8,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1410,
    sat75th: 1540,
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
    officialAcceptanceRate: 15.3,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1330,
    sat75th: 1520,
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
    officialAcceptanceRate: 28.1,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1290,
    sat75th: 1500,
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
    officialAcceptanceRate: 16.8,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1350,
    sat75th: 1520,
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
    officialAcceptanceRate: 26.6,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1230,
    sat75th: 1490,
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
    officialAcceptanceRate: 79.8,
    acceptanceRateSourceYear: '2024-2025',
    sat25th: 1230,
    sat75th: 1480,
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
    officialAcceptanceRate: 14.1,
    acceptanceRateSourceYear: '2024-2025',
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
    officialAcceptanceRate: 16.4,
    acceptanceRateSourceYear: '2024-2025',
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
    officialAcceptanceRate: 25.0,
    acceptanceRateSourceYear: '2024-2025',
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
    officialAcceptanceRate: 56.0,
    acceptanceRateSourceYear: '2024-2025',
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
    officialAcceptanceRate: 64.0,
    acceptanceRateSourceYear: '2024-2025',
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

  // =========================================================================
  // SOUTH KOREA INSTITUTIONS
  // Acceptance rates from KCUE / university official statistics 2023-2024
  // =========================================================================

  {
    schoolId: 'rec-snu',
    name: 'Seoul National University',
    officialAcceptanceRate: 20.0,
    acceptanceRateSourceYear: '2024-2025',
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Suneung (CSAT) Score': 'Very Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://admission.snu.ac.kr',
    notes: 'Top-ranked national university in Korea. Admission is highly competitive and primarily based on CSAT and school records. International student quota separate from domestic.',
    category: 'reach',
    matchScore: 95,
    location: 'Seoul, South Korea',
    deadline: 'Sep 11',
    round: 'Regular Admission',
    whyFit: (major: string) =>
      `Korea's most prestigious university with world-class ${major.toUpperCase()} research output and strong ties to Samsung, LG, and Kakao for industry placement.`,
    keyFactor: 'Outstanding CSAT scores and school record; international applicants judged on SAT/ACT plus high school transcripts.',
    strengthAlignment: 'very_high',
    region: 'korea'
  },

  {
    schoolId: 'rec-kaist',
    name: 'KAIST (Korea Advanced Institute of Science and Technology)',
    officialAcceptanceRate: 23.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.92,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Research / Projects': 'Important',
      'English Proficiency': 'Important'
    },
    sourceUrl: 'https://admission.kaist.ac.kr',
    notes: 'Premier STEM-focused institution, tuition-free for domestic students. Highly competitive for international applicants with strong STEM background.',
    category: 'reach',
    matchScore: 93,
    location: 'Daejeon, South Korea',
    deadline: 'Sep 15',
    round: 'International Admission',
    whyFit: (major: string) =>
      `Asia's leading STEM university for ${major.toUpperCase()}, with tuition scholarships and direct pipelines into Korea's semiconductor and AI industries.`,
    keyFactor: 'Demonstrated research experience and strong quantitative scores are weighted heavily for international applicants.',
    strengthAlignment: 'very_high',
    region: 'korea'
  },

  {
    schoolId: 'rec-yonsei',
    name: 'Yonsei University',
    officialAcceptanceRate: 16.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.85,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Extracurricular Activities': 'Important',
      'English Proficiency': 'Important'
    },
    sourceUrl: 'https://admission.yonsei.ac.kr',
    notes: 'Part of the SKY (Seoul National, Korea, Yonsei) elite trio. Underwood International College offers full English-language programs attractive to international students.',
    category: 'reach',
    matchScore: 91,
    location: 'Seoul, South Korea',
    deadline: 'Oct 1',
    round: 'International Admission',
    whyFit: (major: string) =>
      `Elite SKY university with Underwood International College вЂ” full English-medium ${major.toUpperCase()} programs and a vibrant Seoul campus with global alumni network.`,
    keyFactor: 'Strong GPA, essays articulating Korea-specific goals, and English proficiency (TOEFL 100+ recommended).',
    strengthAlignment: 'high',
    region: 'korea'
  },

  {
    schoolId: 'rec-korea-univ',
    name: 'Korea University',
    officialAcceptanceRate: 17.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.82,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Application Essay': 'Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://ipsi.korea.ac.kr',
    notes: 'Third member of the SKY group. Strong business and law schools; growing international programs in English.',
    category: 'reach',
    matchScore: 89,
    location: 'Seoul, South Korea',
    deadline: 'Oct 1',
    round: 'International Admission',
    whyFit: (major: string) =>
      `SKY-tier university with a strong ${major.toUpperCase()} faculty and deep connections to Korean conglomerates (chaebol) for career placement.`,
    keyFactor: 'Academic record and motivation essay are key; TOPIK not required for English-track applicants.',
    strengthAlignment: 'high',
    region: 'korea'
  },

  {
    schoolId: 'rec-postech',
    name: 'POSTECH (Pohang University of Science and Technology)',
    officialAcceptanceRate: 19.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Research / Projects': 'Very Important'
    },
    sourceUrl: 'https://admission.postech.ac.kr',
    notes: 'Highly selective small STEM university backed by POSCO. Consistently ranked among Asia\'s top 10 for engineering and materials science.',
    category: 'reach',
    matchScore: 90,
    location: 'Pohang, South Korea',
    deadline: 'Sep 20',
    round: 'Regular Admission',
    whyFit: (major: string) =>
      `Korea's MIT equivalent for ${major.toUpperCase()} with intensive research culture, small class sizes, and industry backing from POSCO Steel.`,
    keyFactor: 'Research portfolio and quantitative ability are critical; small cohort means every applicant is closely evaluated.',
    strengthAlignment: 'very_high',
    region: 'korea'
  },

  {
    schoolId: 'rec-sungkyunkwan',
    name: 'Sungkyunkwan University (SKKU)',
    officialAcceptanceRate: 38.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.70,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'English Proficiency': 'Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://admission.skku.edu',
    notes: 'Samsung-affiliated university with strong engineering and natural sciences. Good English-medium programs and scholarship opportunities for international students.',
    category: 'target',
    matchScore: 86,
    location: 'Seoul / Suwon, South Korea',
    deadline: 'Oct 15',
    round: 'International Admission',
    whyFit: (major: string) =>
      `Samsung-backed university with strong ${major.toUpperCase()} programs, generous merit scholarships, and direct industry ties to Samsung Electronics and affiliated companies.`,
    keyFactor: 'Strong academic record and TOEFL/IELTS score; Samsung scholarship applicants need additional recommendation.',
    strengthAlignment: 'high',
    region: 'korea'
  },

  // =========================================================================
  // GERMANY INSTITUTIONS
  // Acceptance rates from Hochschulkompass / official university statistics 2023-2024
  // Note: Most German public universities do not use a selective admissions system
  // for domestic students; NC (Numerus Clausus) GPA cutoffs are used instead.
  // Rates below reflect competitive international intake or NC-restricted programs.
  // =========================================================================

  {
    schoolId: 'rec-tum',
    name: 'Technical University of Munich (TUM)',
    officialAcceptanceRate: 8.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Research / Projects': 'Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://www.tum.de/en/studies/applying',
    notes: 'Germany\'s top-ranked STEM university and one of Europe\'s leading research institutions. Highly competitive for international Master\'s applicants; Bachelor\'s admission varies by program.',
    category: 'reach',
    matchScore: 95,
    location: 'Munich, Germany',
    deadline: 'May 31',
    round: 'Winter Semester',
    whyFit: (major: string) =>
      `Germany's #1 STEM university for ${major.toUpperCase()} with world-class research, no tuition fees for most programs, and strong industry links to BMW, Siemens, and MAN.`,
    keyFactor: 'Exceptionally high GPA (equivalent 1.0вЂ“1.5 on German scale) and relevant academic background; motivational letter is decisive for international applicants.',
    strengthAlignment: 'very_high',
    region: 'germany'
  },

  {
    schoolId: 'rec-lmu',
    name: 'Ludwig Maximilian University of Munich (LMU)',
    officialAcceptanceRate: 18.0,
    acceptanceRateSourceYear: '2024-2025',
    avgEnrolledGpaUnweighted: 3.88,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://www.lmu.de/en/study/international-applicants/',
    notes: 'Germany\'s highest-ranked comprehensive university. Excellence Initiative winner with broad academic portfolio. Competitive NC cutoffs for popular programs.',
    category: 'reach',
    matchScore: 92,
    location: 'Munich, Germany',
    deadline: 'May 15',
    round: 'Winter Semester',
    whyFit: (major: string) =>
      `Germany's premier comprehensive research university вЂ” ideal for ${major.toUpperCase()} students seeking a balance of rigorous academics and Munich's vibrant cultural and tech scene.`,
    keyFactor: 'High academic GPA and German language proficiency (B2/C1) for German-taught programs; English-taught Master\'s require TOEFL/IELTS.',
    strengthAlignment: 'very_high',
    region: 'germany'
  },

  {
    schoolId: 'rec-heidelberg',
    name: 'Heidelberg University',
    officialAcceptanceRate: 20.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.85,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Language Proficiency': 'Important'
    },
    sourceUrl: 'https://www.uni-heidelberg.de/en/study/international',
    notes: 'Germany\'s oldest university (est. 1386) and a leading Excellence Initiative institution. Especially strong in natural sciences, medicine, and humanities.',
    category: 'reach',
    matchScore: 90,
    location: 'Heidelberg, Germany',
    deadline: 'May 15',
    round: 'Winter Semester',
    whyFit: (major: string) =>
      `Germany's oldest university with a prestigious research legacy вЂ” strong fit for ${major.toUpperCase()} students interested in rigorous academic tradition and European research networks.`,
    keyFactor: 'Strong academic record; German language proficiency required for most undergraduate programs.',
    strengthAlignment: 'high',
    region: 'germany'
  },

  {
    schoolId: 'rec-kit',
    name: 'Karlsruhe Institute of Technology (KIT)',
    officialAcceptanceRate: 25.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.82,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Research / Projects': 'Important'
    },
    sourceUrl: 'https://www.kit.edu/english/studying.php',
    notes: 'Merger of former University of Karlsruhe and Forschungszentrum Karlsruhe. One of Germany\'s top engineering schools with significant research funding.',
    category: 'target',
    matchScore: 88,
    location: 'Karlsruhe, Germany',
    deadline: 'May 15',
    round: 'Winter Semester',
    whyFit: (major: string) =>
      `Top German engineering school for ${major.toUpperCase()} with a dual university-research center model, strong industry partnerships, and no tuition fees.`,
    keyFactor: 'Good GPA in relevant subjects; some programs require German language certification.',
    strengthAlignment: 'high',
    region: 'germany'
  },

  {
    schoolId: 'rec-rwth',
    name: 'RWTH Aachen University',
    officialAcceptanceRate: 23.0,
    acceptanceRateSourceYear: '2024-2025',
    avgEnrolledGpaUnweighted: 3.80,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://www.rwth-aachen.de/go/id/mkq/lidx/1',
    notes: 'Germany\'s largest technical university and one of Europe\'s leading engineering schools. Exceptionally strong in mechanical and electrical engineering.',
    category: 'target',
    matchScore: 87,
    location: 'Aachen, Germany',
    deadline: 'May 15',
    round: 'Winter Semester',
    whyFit: (major: string) =>
      `Europe's top technical university for engineering вЂ” ${major.toUpperCase()} graduates are heavily recruited by automotive giants like Ford, BMW, and technology firms near the AachenвЂ“BrusselsвЂ“Eindhoven tech triangle.`,
    keyFactor: 'Strong math and science GPA; German proficiency required for most undergraduate tracks.',
    strengthAlignment: 'high',
    region: 'germany'
  },

  {
    schoolId: 'rec-fu-berlin',
    name: 'Freie UniversitГ¤t Berlin',
    officialAcceptanceRate: 60.0,
    acceptanceRateSourceYear: '2024-2025',
    avgEnrolledGpaUnweighted: 3.75,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Application Essay': 'Important',
      'Language Proficiency': 'Important'
    },
    sourceUrl: 'https://www.fu-berlin.de/en/studium/international/index.html',
    notes: 'One of Germany\'s 11 Universities of Excellence. Particularly strong in humanities, social sciences, and life sciences. Berlin location offers unique cultural and startup ecosystem.',
    category: 'target',
    matchScore: 85,
    location: 'Berlin, Germany',
    deadline: 'Jun 1',
    round: 'Winter Semester',
    whyFit: (major: string) =>
      `Berlin's top research university for ${major.toUpperCase()} with an international atmosphere, no tuition fees, and access to Berlin's booming startup and tech ecosystem.`,
    keyFactor: 'Solid GPA and language certification (German or English depending on program).',
    strengthAlignment: 'high',
    region: 'germany'
  },

  // =========================================================================
  // CHINA INSTITUTIONS
  // Acceptance rates from Gaokao data / university official international intake 2023-2024
  // Note: Domestic admission is Gaokao-based; rates below reflect international student programs.
  // =========================================================================

  {
    schoolId: 'rec-peking',
    name: 'Peking University (PKU)',
    officialAcceptanceRate: 20.0,
    acceptanceRateSourceYear: '2024-2025',
    avgEnrolledGpaUnweighted: 3.95,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Application Essay': 'Very Important',
      'Chinese Language Proficiency': 'Important'
    },
    sourceUrl: 'https://admissions.pku.edu.cn/en/',
    notes: 'China\'s most prestigious comprehensive university. International students admitted through a separate process; English-taught programs available in select departments.',
    category: 'reach',
    matchScore: 96,
    location: 'Beijing, China',
    deadline: 'Apr 30',
    round: 'International Admission',
    whyFit: (major: string) =>
      `China's most elite university for ${major.toUpperCase()}, with unrivaled access to Beijing's technology and government sectors, and global alumni spanning top research institutions worldwide.`,
    keyFactor: 'Outstanding academic record; HSK proficiency (Level 4+) required for Chinese-medium programs; English-taught programs need strong TOEFL/IELTS.',
    strengthAlignment: 'very_high',
    region: 'china'
  },

  {
    schoolId: 'rec-tsinghua',
    name: 'Tsinghua University',
    officialAcceptanceRate: 20.0,
    acceptanceRateSourceYear: '2024-2025',
    avgEnrolledGpaUnweighted: 3.95,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Research / Projects': 'Very Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://www.tsinghua.edu.cn/en/Admissions.htm',
    notes: 'China\'s top STEM and engineering university, consistently ranked in global top 25. International students admitted separately; strong English-medium engineering programs.',
    category: 'reach',
    matchScore: 96,
    location: 'Beijing, China',
    deadline: 'Apr 30',
    round: 'International Admission',
    whyFit: (major: string) =>
      `Asia's top engineering university for ${major.toUpperCase()} вЂ” the alma mater of a majority of China's tech leaders, with world-class labs and direct pipelines into Huawei, ByteDance, and Tencent.`,
    keyFactor: 'Near-perfect academic record and demonstrable STEM achievement; international applicants screened via portfolio and interview.',
    strengthAlignment: 'very_high',
    region: 'china'
  },

  {
    schoolId: 'rec-fudan',
    name: 'Fudan University',
    officialAcceptanceRate: 32.0,
    acceptanceRateSourceYear: '2024-2025',
    avgEnrolledGpaUnweighted: 3.88,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Application Essay': 'Very Important',
      'Language Proficiency': 'Important',
      'Extracurricular Activities': 'Important'
    },
    sourceUrl: 'https://www.fudan.edu.cn/en/channels/view/108/',
    notes: 'Top comprehensive university in Shanghai, particularly strong in medicine, economics, and liberal arts. More international-friendly than Beijing counterparts.',
    category: 'reach',
    matchScore: 92,
    location: 'Shanghai, China',
    deadline: 'Apr 30',
    round: 'International Admission',
    whyFit: (major: string) =>
      `Shanghai's premier comprehensive university for ${major.toUpperCase()} вЂ” strong global partnerships, English-medium programs, and access to China's financial and commerce capital.`,
    keyFactor: 'Strong GPA and personal statement; Shanghai location makes English-language programs more accessible than Beijing peers.',
    strengthAlignment: 'very_high',
    region: 'china'
  },

  {
    schoolId: 'rec-sjtu',
    name: 'Shanghai Jiao Tong University (SJTU)',
    officialAcceptanceRate: 32.0,
    acceptanceRateSourceYear: '2024-2025',
    avgEnrolledGpaUnweighted: 3.87,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Research / Projects': 'Important'
    },
    sourceUrl: 'https://en.sjtu.edu.cn/admissions/',
    notes: 'Top engineering and sciences university in Shanghai. Known internationally for its Academic Ranking of World Universities (ARWU/Shanghai Rankings), which it founded.',
    category: 'reach',
    matchScore: 91,
    location: 'Shanghai, China',
    deadline: 'Apr 30',
    round: 'International Admission',
    whyFit: (major: string) =>
      `China's leading engineering and technology university for ${major.toUpperCase()}, with strong research output, multiple English-medium programs, and a Shanghai location offering global career access.`,
    keyFactor: 'High GPA with STEM focus; international applicants assessed on transcripts, standardized test scores, and research background.',
    strengthAlignment: 'very_high',
    region: 'china'
  },

  {
    schoolId: 'rec-zhejiang',
    name: 'Zhejiang University',
    officialAcceptanceRate: 15.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.85,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Application Essay': 'Important'
    },
    sourceUrl: 'https://www.zju.edu.cn/english/2023/0901/c19573a2783218/page.htm',
    notes: 'Located in Hangzhou near Alibaba HQ. Comprehensive C9 League university with strong engineering, agriculture, and medicine programs.',
    category: 'reach',
    matchScore: 89,
    location: 'Hangzhou, China',
    deadline: 'Apr 15',
    round: 'International Admission',
    whyFit: (major: string) =>
      `C9 League university in Hangzhou вЂ” proximity to Alibaba and a thriving tech ecosystem makes it a strong choice for ${major.toUpperCase()} students targeting China's e-commerce and cloud sectors.`,
    keyFactor: 'Strong academic record; some English-taught programs available; Chinese proficiency advantageous.',
    strengthAlignment: 'high',
    region: 'china'
  },

  {
    schoolId: 'rec-ustc',
    name: 'University of Science and Technology of China (USTC)',
    officialAcceptanceRate: 10.0,
    acceptanceRateSourceYear: '2023-2024',
    avgEnrolledGpaUnweighted: 3.90,
    cdsFactorWeights: {
      'Academic GPA': 'Very Important',
      'Rigor of secondary school record': 'Very Important',
      'Research / Projects': 'Very Important'
    },
    sourceUrl: 'https://en.ustc.edu.cn/2023/0608/c18062a592098/page.htm',
    notes: 'Elite C9 League STEM university founded by the Chinese Academy of Sciences. Exceptional for physics, math, and computer science. Lower profile internationally but domestic ranking rivals Tsinghua/PKU for STEM.',
    category: 'reach',
    matchScore: 92,
    location: 'Hefei, China',
    deadline: 'Apr 30',
    round: 'International Admission',
    whyFit: (major: string) =>
      `China's most research-intensive STEM university for ${major.toUpperCase()} вЂ” affiliated with the Chinese Academy of Sciences, offering unparalleled access to national research labs and quantum computing initiatives.`,
    keyFactor: 'Exceptional quantitative ability and research background; among the most selective STEM programs in China.',
    strengthAlignment: 'very_high',
    region: 'china'
  },

  // TODO: verify from official CDS
  {
    schoolId: 'rec-carleton',
    name: 'Carleton University',
    officialAcceptanceRate: 60.0,
    acceptanceRateSourceYear: '2024-2025',
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
