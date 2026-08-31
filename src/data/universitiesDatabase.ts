import { CollegeCategory } from '../types';

export interface UniversityInfo {
  id: string;
  name: string;
  shortName: string;
  category: CollegeCategory;
  location: string;
  setting: 'Urban' | 'Suburban' | 'College Town' | 'Rural';
  acceptanceRate: string;
  middleSat: string;
  middleAct: string;
  avgGpa: string;
  undergradEnrollment: string;
  tuition: string;
  popularMajors: string[];
  deadlineEA_ED: string;
  deadlineRD: string;
  financialAid: {
    needBlindDomestic: boolean;
    needBlindIntl: boolean;
    meetsFullNeed: boolean;
    avgFinancialAid: string;
    aidNote: string;
  };
  requirements: {
    applicationSystem: string;
    supplementCount: string;
    testingPolicy: string;
    recsRequired: string;
    interviewPolicy: string;
  };
  overview: string;
  admissionsStrategyTip: string;
  keyStrengths: string[];
}

export const UNIVERSITIES_DATABASE: UniversityInfo[] = [
  {
    id: 'mit',
    name: 'Massachusetts Institute of Technology (MIT)',
    shortName: 'MIT',
    category: 'reach',
    location: 'Cambridge, MA',
    setting: 'Urban',
    acceptanceRate: '3.9%',
    middleSat: '1510 - 1580',
    middleAct: '34 - 36',
    avgGpa: '3.96 (UW)',
    undergradEnrollment: '4,638',
    tuition: '$61,990 / yr',
    popularMajors: ['Computer Science (6-3)', 'Mechanical Engineering', 'Mathematics', 'Physics', 'Artificial Intelligence'],
    deadlineEA_ED: 'Nov 1 (Early Action)',
    deadlineRD: 'Jan 1 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: true,
      meetsFullNeed: true,
      avgFinancialAid: '$56,000 / yr',
      aidNote: 'Tuition-free for families earning under $140,000/yr.'
    },
    requirements: {
      applicationSystem: 'MIT Application Portal (Separate from Common App)',
      supplementCount: '5 short answer responses (100-250 words) + optional Maker Portfolio',
      testingPolicy: 'Test Mandatory (SAT/ACT required)',
      recsRequired: '2 letters: 1 Math/Science teacher + 1 Humanities/Social Science teacher',
      interviewPolicy: 'Educational Counselor (EC) interview offered via Zoom or in-person'
    },
    overview: 'World-renowned STEM powerhouse known for intense academic rigor, hands-on maker culture ("Mens et Manus"), and cutting-edge research in robotics, computer science, and engineering.',
    admissionsStrategyTip: 'Highlight tangible creations, research impact, collaborative problem-solving, and intellectual curiosity. Use the Maker Portfolio if you build hardware or write software.',
    keyStrengths: ['#1 World Engineering', 'Maker Portfolio & UROP Research', 'Need-Blind for International Students', 'Strong Entrepreneurship Hub']
  },
  {
    id: 'stanford',
    name: 'Stanford University',
    shortName: 'Stanford',
    category: 'reach',
    location: 'Stanford, CA',
    setting: 'Suburban',
    acceptanceRate: '3.6%',
    middleSat: '1500 - 1570',
    middleAct: '33 - 35',
    avgGpa: '3.95 (UW)',
    undergradEnrollment: '7,761',
    tuition: '$62,484 / yr',
    popularMajors: ['Computer Science', 'Symbolic Systems', 'Human Biology', 'Economics', 'Management Science & Engineering'],
    deadlineEA_ED: 'Nov 1 (Restrictive Early Action)',
    deadlineRD: 'Jan 5 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: true,
      avgFinancialAid: '$62,000 / yr',
      aidNote: 'Free tuition and room & board for family incomes under $100,000/yr.'
    },
    requirements: {
      applicationSystem: 'Common App / Coalition',
      supplementCount: '3 essays (100-250 words) + 5 short questions (50 words each)',
      testingPolicy: 'Test Mandatory (Resumed SAT/ACT requirement)',
      recsRequired: '2 academic teacher letters + counselor recommendation',
      interviewPolicy: 'Optional alumni interview based on local availability'
    },
    overview: 'Silicon Valley anchor blending elite academic depth with entrepreneurship, sunny campus life, interdisciplinary flexibility, and athletic excellence.',
    admissionsStrategyTip: 'Stanford values "Intellectual Vitality" (learning for joy, not just grades) and authentic voice in the "Roommate Essay" and "What is meaningful to you" prompts.',
    keyStrengths: ['Proximity to Tech & Venture Capital', 'Symbolic Systems & AI Leadership', 'D.School (Design Thinking)', 'Strong Humanities & Sciences']
  },
  {
    id: 'harvard',
    name: 'Harvard University',
    shortName: 'Harvard',
    category: 'reach',
    location: 'Cambridge, MA',
    setting: 'Urban',
    acceptanceRate: '3.4%',
    middleSat: '1500 - 1580',
    middleAct: '34 - 36',
    avgGpa: '3.96 (UW)',
    undergradEnrollment: '7,153',
    tuition: '$59,076 / yr',
    popularMajors: ['Economics', 'Government', 'Computer Science', 'Applied Mathematics', 'Molecular & Cellular Biology'],
    deadlineEA_ED: 'Nov 1 (Restricted Early Action)',
    deadlineRD: 'Jan 1 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: true,
      meetsFullNeed: true,
      avgFinancialAid: '$67,000 / yr',
      aidNote: '100% free for families earning under $85,000/year with no loans.'
    },
    requirements: {
      applicationSystem: 'Common App / Coalition',
      supplementCount: '5 short essays (200 words each)',
      testingPolicy: 'Test Mandatory (SAT/ACT required)',
      recsRequired: '2 teacher recommendations + counselor report',
      interviewPolicy: 'Alumni interview offered to most applicants globally'
    },
    overview: 'The oldest institution of higher learning in the US, offering unmatched historical prestige, a $50B+ endowment, residential House system, and global network.',
    admissionsStrategyTip: 'Look for exceptional depth in 1-2 spike areas (national/international recognition) or an unusually compelling personal narrative that adds distinct value to Harvard residential life.',
    keyStrengths: ['Global Alumni Network', 'Need-Blind Worldwide', 'Harvard Innovation Labs', 'Endowment Resources & Cross-Registration with MIT']
  },
  {
    id: 'princeton',
    name: 'Princeton University',
    shortName: 'Princeton',
    category: 'reach',
    location: 'Princeton, NJ',
    setting: 'Suburban',
    acceptanceRate: '4.4%',
    middleSat: '1510 - 1580',
    middleAct: '34 - 35',
    avgGpa: '3.95 (UW)',
    undergradEnrollment: '5,548',
    tuition: '$59,710 / yr',
    popularMajors: ['Computer Science (BSE/AB)', 'Economics', 'Public & International Affairs (SPIA)', 'Operations Research', 'History'],
    deadlineEA_ED: 'Nov 1 (Single-Choice Early Action)',
    deadlineRD: 'Jan 1 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: true,
      meetsFullNeed: true,
      avgFinancialAid: '$64,000 / yr',
      aidNote: 'No-loan policy; covers 100% tuition and living for incomes under $100k.'
    },
    requirements: {
      applicationSystem: 'Common App / Coalition',
      supplementCount: '3 essays + Graded Written Paper required',
      testingPolicy: 'Test Mandatory (SAT/ACT required)',
      recsRequired: '2 academic teacher recommendations + counselor report',
      interviewPolicy: 'Alumni interview requested based on regional committees'
    },
    overview: 'Unmatched undergraduate focus with no separate professional law or business schools, requiring all seniors to complete a groundbreaking Senior Thesis.',
    admissionsStrategyTip: 'Demonstrate scholarship and genuine academic writing depth. Ensure your submitted Graded Paper is analytical with thorough teacher feedback.',
    keyStrengths: ['Undergraduate-First Focus', 'Senior Thesis Requirement', 'Generous No-Loan Aid', 'School of Public & International Affairs']
  },
  {
    id: 'caltech',
    name: 'California Institute of Technology (Caltech)',
    shortName: 'Caltech',
    category: 'reach',
    location: 'Pasadena, CA',
    setting: 'Suburban',
    acceptanceRate: '3.1%',
    middleSat: '1530 - 1580',
    middleAct: '35 - 36',
    avgGpa: '3.98 (UW)',
    undergradEnrollment: '987',
    tuition: '$60,864 / yr',
    popularMajors: ['Computer Science', 'Physics', 'Mechanical Engineering', 'Bioengineering', 'Applied Physics'],
    deadlineEA_ED: 'Nov 1 (Restrictive Early Action)',
    deadlineRD: 'Jan 3 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: true,
      avgFinancialAid: '$58,000 / yr',
      aidNote: 'Meets 100% demonstrated financial need for all admitted students.'
    },
    requirements: {
      applicationSystem: 'Common App',
      supplementCount: '3 STEM-specific essay prompts (ethical scientific dilemma, STEM passion, collaboration)',
      testingPolicy: 'Test-Free / Test-Blind (Caltech does not look at SAT/ACT)',
      recsRequired: '1 STEM teacher + 1 Humanities teacher',
      interviewPolicy: 'No admissions interviews'
    },
    overview: 'Intimate, intense scientific research institution managing NASA’s Jet Propulsion Laboratory (JPL) with a tiny 3:1 student-to-faculty ratio.',
    admissionsStrategyTip: 'Pure scientific and mathematical brilliance is essential. Highlight advanced coursework (multivariable calculus, linear algebra, Olympiads, physics competitions).',
    keyStrengths: ['NASA Jet Propulsion Lab (JPL)', '3:1 Student-Faculty Ratio', 'Pure STEM & Physics Excellence', 'Honor Code Culture']
  },
  {
    id: 'uc-berkeley',
    name: 'University of California, Berkeley',
    shortName: 'UC Berkeley',
    category: 'reach',
    location: 'Berkeley, CA',
    setting: 'Urban',
    acceptanceRate: '11.4%',
    middleSat: 'Test Blind',
    middleAct: 'Test Blind',
    avgGpa: '3.90 - 4.00 (UW)',
    undergradEnrollment: '32,831',
    tuition: '$14,226 (In-State) / $44,008 (Out-of-State)',
    popularMajors: ['Electrical Engineering & Computer Sciences (EECS)', 'Data Science', 'Economics', 'Business Administration (Haas)', 'Cellular Biology'],
    deadlineEA_ED: 'None (UCs have 1 deadline)',
    deadlineRD: 'Nov 30 (UC Application Deadline)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: false,
      avgFinancialAid: '$24,000 / yr',
      aidNote: 'Blue and Gold Opportunity Plan covers systemwide fees for CA residents under $80k.'
    },
    requirements: {
      applicationSystem: 'University of California (UC) Application Portal',
      supplementCount: '4 of 8 Personal Insight Questions (PIQs) - 350 words each',
      testingPolicy: 'Test-Blind (SAT/ACT scores not considered for admission)',
      recsRequired: 'Not accepted at initial submission (invited by request only)',
      interviewPolicy: 'None for general admissions'
    },
    overview: 'The premier public research university in the world, renowned for civil rights history, Nobel laureates, and top-ranked engineering and business schools.',
    admissionsStrategyTip: 'For UC Berkeley, your 4 PIQs must be clear, concise, and direct about challenges, leadership initiatives, and academic preparation. Avoid overly metaphorical prose.',
    keyStrengths: ['#1 Public University in US', 'Haas School of Business', 'Top 3 Computer Science Worldwide', 'Unparalleled Research Output']
  },
  {
    id: 'cmu',
    name: 'Carnegie Mellon University',
    shortName: 'Carnegie Mellon (CMU)',
    category: 'reach',
    location: 'Pittsburgh, PA',
    setting: 'Urban',
    acceptanceRate: '11.0%',
    middleSat: '1500 - 1560',
    middleAct: '34 - 35',
    avgGpa: '3.92 (UW)',
    undergradEnrollment: '7,022',
    tuition: '$62,260 / yr',
    popularMajors: ['School of Computer Science (SCS)', 'Robotics', 'Electrical & Computer Engineering (ECE)', 'Drama / Acting', 'Information Systems'],
    deadlineEA_ED: 'Nov 1 (Early Decision I)',
    deadlineRD: 'Jan 3 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: true,
      avgFinancialAid: '$52,000 / yr',
      aidNote: 'Need-based financial aid for US citizens and permanent residents.'
    },
    requirements: {
      applicationSystem: 'Common App',
      supplementCount: '3 short answers (300 words each)',
      testingPolicy: 'Test-Optional (except SCS strongly recommends scores)',
      recsRequired: '1 counselor + 1-2 teacher recommendations',
      interviewPolicy: 'Not offered for academic majors; auditions required for fine arts'
    },
    overview: 'Pioneering intersection of technology, artificial intelligence, robotics, design, and drama. Home of the #1 ranked School of Computer Science (SCS).',
    admissionsStrategyTip: 'CMU SCS admissions is extremely competitive (< 4% admit rate). Highlight programming algorithms, robotics builds, math contests, and why CMU’s interdisciplinary curriculum is essential.',
    keyStrengths: ['#1 School of Computer Science', 'Robotics Institute', 'Entertainment Technology Center', 'Top Drama & Design School']
  },
  {
    id: 'columbia',
    name: 'Columbia University',
    shortName: 'Columbia',
    category: 'reach',
    location: 'New York, NY',
    setting: 'Urban',
    acceptanceRate: '3.9%',
    middleSat: '1500 - 1560',
    middleAct: '34 - 35',
    avgGpa: '3.94 (UW)',
    undergradEnrollment: '6,690',
    tuition: '$65,524 / yr',
    popularMajors: ['Economics', 'Computer Science', 'Political Science', 'History', 'Biomedical Engineering'],
    deadlineEA_ED: 'Nov 1 (Early Decision)',
    deadlineRD: 'Jan 1 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: true,
      avgFinancialAid: '$66,000 / yr',
      aidNote: 'Tuition-free for families with income below $150,000 with typical assets.'
    },
    requirements: {
      applicationSystem: 'Common App / Coalition',
      supplementCount: 'Columbia-specific book list prompt + 3 supplemental essays',
      testingPolicy: 'Test-Optional permanently',
      recsRequired: '2 academic teacher letters + counselor report',
      interviewPolicy: 'Conducted virtually by alumni when available'
    },
    overview: 'Ivy League powerhouse in Manhattan centered on the famous Core Curriculum—a shared canon of philosophical, literary, and scientific masterworks.',
    admissionsStrategyTip: 'Show genuine passion for the Core Curriculum (Contemporary Civilization, Literature Humanities). List eclectic, intellectual books, films, and podcasts in their unique media prompt.',
    keyStrengths: ['Manhattan / NYC Location & Internships', 'The Core Curriculum', 'Columbia Engineering (SEAS)', 'Pulitzer Prize & Journalism Heritage']
  },
  {
    id: 'umich',
    name: 'University of Michigan',
    shortName: 'U-Michigan',
    category: 'target',
    location: 'Ann Arbor, MI',
    setting: 'College Town',
    acceptanceRate: '17.7%',
    middleSat: '1430 - 1540',
    middleAct: '31 - 34',
    avgGpa: '3.90 (UW)',
    undergradEnrollment: '32,282',
    tuition: '$17,786 (In-State) / $57,273 (Out-of-State)',
    popularMajors: ['Computer Science', 'Ross School of Business', 'Mechanical Engineering', 'Psychology', 'Biomedical Engineering'],
    deadlineEA_ED: 'Nov 1 (Early Action)',
    deadlineRD: 'Feb 1 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: true,
      avgFinancialAid: '$28,000 / yr',
      aidNote: 'Go Blue Guarantee covers full tuition for in-state families under $75k.'
    },
    requirements: {
      applicationSystem: 'Common App',
      supplementCount: '2 essays: Community essay (300 words) + "Why Michigan" essay (550 words)',
      testingPolicy: 'Test-Optional',
      recsRequired: '1 teacher recommendation + counselor report',
      interviewPolicy: 'No admissions interviews'
    },
    overview: 'Top-tier public research university with iconic school spirit ("Go Blue"), top 10 programs in engineering, business (Ross), and liberal arts (LSA).',
    admissionsStrategyTip: 'Write a hyper-specific "Why Michigan" essay. Name exact upper-level courses, specific research laboratories, student project teams (e.g. Solar Car), and professors.',
    keyStrengths: ['Ross School of Business', 'Grainger & Michigan Engineering', 'Huge Global Alumni Base', 'Iconic College Town Experience']
  },
  {
    id: 'gatech',
    name: 'Georgia Institute of Technology',
    shortName: 'Georgia Tech',
    category: 'target',
    location: 'Atlanta, GA',
    setting: 'Urban',
    acceptanceRate: '15.0%',
    middleSat: '1370 - 1530',
    middleAct: '31 - 35',
    avgGpa: '3.88 (UW)',
    undergradEnrollment: '17,447',
    tuition: '$12,852 (In-State) / $33,964 (Out-of-State)',
    popularMajors: ['Computer Science (Threads)', 'Mechanical Engineering', 'Industrial & Systems Engineering (#1 in US)', 'Biomedical Engineering', 'Aerospace Engineering'],
    deadlineEA_ED: 'Oct 15 (EA1 - GA residents) / Nov 1 (EA2 - Out-of-State)',
    deadlineRD: 'Jan 5 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: false,
      avgFinancialAid: '$15,000 / yr',
      aidNote: 'HOPE/Zell Miller scholarships cover 100% tuition for qualifying Georgia residents.'
    },
    requirements: {
      applicationSystem: 'Common App',
      supplementCount: '1 essay: "Why Georgia Tech & Your Intended Major" (300 words)',
      testingPolicy: 'Test Mandatory (SAT/ACT required by University System of GA)',
      recsRequired: 'Optional teacher recommendation (1 maximum)',
      interviewPolicy: 'None'
    },
    overview: 'Top public technological university located in Midtown Atlanta, famous for its Industrial Engineering program, high ROI, Co-op programs, and CS "Threads" curriculum.',
    admissionsStrategyTip: 'Georgia Tech values demonstrated STEM skills, math preparedness through calculus, and alignment with their unique CS Threads or Engineering Co-op tracks.',
    keyStrengths: ['#1 Industrial & Systems Engineering', 'CS Threads Modular Specialization', 'Midtown Atlanta Tech Square', 'Incredible Return on Investment (ROI)']
  },
  {
    id: 'uiuc',
    name: 'University of Illinois Urbana-Champaign',
    shortName: 'UIUC (Grainger)',
    category: 'target',
    location: 'Urbana-Champaign, IL',
    setting: 'College Town',
    acceptanceRate: '23.0% (Grainger CS: ~6.5%)',
    middleSat: '1410 - 1530',
    middleAct: '31 - 34',
    avgGpa: '3.85 (UW)',
    undergradEnrollment: '35,000',
    tuition: '$17,138 (In-State) / $36,178 (Out-of-State)',
    popularMajors: ['Computer Science (Grainger)', 'Electrical Engineering', 'Accountancy (Gies)', 'Bioengineering', 'CS + X Programs'],
    deadlineEA_ED: 'Nov 1 (Early Action)',
    deadlineRD: 'Jan 5 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: false,
      avgFinancialAid: '$18,000 / yr',
      aidNote: 'Illinois Commitment covers tuition & fees for in-state students under $67,100.'
    },
    requirements: {
      applicationSystem: 'Common App / myIllini',
      supplementCount: '2-3 major-specific prompts (150 words each)',
      testingPolicy: 'Test-Optional',
      recsRequired: 'None (UIUC does not accept letters of recommendation)',
      interviewPolicy: 'None'
    },
    overview: 'Powerhouse engineering campus where web browsers (Mosaic), YouTube, and PayPal originated. Top 5 in Computer Science and Materials Engineering.',
    admissionsStrategyTip: 'UIUC admits directly by major. If applying to Grainger CS, show extensive programming, hackathons, and high math AP scores. Look into CS+X programs for higher admission odds.',
    keyStrengths: ['Top 5 CS & Engineering', 'National Center for Supercomputing (NCSA)', 'Gies College of Business', 'Direct-to-Major Admissions']
  },
  {
    id: 'ut-austin',
    name: 'University of Texas at Austin',
    shortName: 'UT Austin',
    category: 'target',
    location: 'Austin, TX',
    setting: 'Urban',
    acceptanceRate: '28.0% (Out-of-State: ~8%)',
    middleSat: '1360 - 1520',
    middleAct: '29 - 34',
    avgGpa: '3.88 (UW)',
    undergradEnrollment: '41,000',
    tuition: '$11,698 (In-State) / $41,070 (Out-of-State)',
    popularMajors: ['Computer Science (Turing Scholars)', 'McCombs School of Business', 'Cockrell School of Engineering', 'Plan II Honors', 'Biochemistry'],
    deadlineEA_ED: 'Oct 15 (Early Action Priority)',
    deadlineRD: 'Dec 1 (Regular Deadline)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: false,
      avgFinancialAid: '$14,000 / yr',
      aidNote: 'Texas Advance Commitment covers tuition for in-state families under $65k.'
    },
    requirements: {
      applicationSystem: 'Common App / ApplyTexas',
      supplementCount: '1 main essay (500-700 words) + 3 short answers (250-300 words)',
      testingPolicy: 'Test Mandatory (SAT/ACT required)',
      recsRequired: '1 required, up to 2 optional',
      interviewPolicy: 'None'
    },
    overview: 'Flagship Texas institution in the vibrant Silicon Hills of Austin, renowned for McCombs Business, Cockrell Engineering, and the Turing Scholars CS program.',
    admissionsStrategyTip: '75% of spots are reserved for top 6% Texas high schoolers. Non-auto-admit and out-of-state applicants must demonstrate clear leadership and major alignment in their essays.',
    keyStrengths: ['Austin Tech & Startups Ecosystem', 'McCombs School of Business', 'Turing Scholars CS Program', 'Cockrell Engineering Innovation']
  },
  {
    id: 'purdue',
    name: 'Purdue University',
    shortName: 'Purdue',
    category: 'safety',
    location: 'West Lafayette, IN',
    setting: 'College Town',
    acceptanceRate: '50.3% (Engineering: ~28%)',
    middleSat: '1210 - 1440',
    middleAct: '27 - 34',
    avgGpa: '3.75 (UW)',
    undergradEnrollment: '37,949',
    tuition: '$9,992 (In-State) / $28,794 (Out-of-State)',
    popularMajors: ['First-Year Engineering (FYE)', 'Aeronautics & Astronautics ("Cradle of Astronauts")', 'Computer Science', 'Mechanical Engineering', 'Agriculture'],
    deadlineEA_ED: 'Nov 1 (Early Action - Priority for Engineering & Honors)',
    deadlineRD: 'Jan 15 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: false,
      avgFinancialAid: '$12,000 / yr',
      aidNote: 'Famous 12-year frozen tuition guarantee keeping out-of-state costs under $30k.'
    },
    requirements: {
      applicationSystem: 'Common App',
      supplementCount: '2 essays: "Why Purdue & Major" (250 words) + Brief Activity elaboration (100 words)',
      testingPolicy: 'Test Mandatory (SAT/ACT required)',
      recsRequired: '1 counselor or teacher recommendation',
      interviewPolicy: 'None'
    },
    overview: 'Legendary engineering and aerospace titan with frozen tuition for over a decade, known as the "Cradle of Astronauts" (Neil Armstrong alma mater).',
    admissionsStrategyTip: 'Always apply by the Nov 1 Early Action deadline. Over 80% of competitive engineering and CS seats are filled during the EA round.',
    keyStrengths: ['12-Year Frozen Tuition', '#1 Aerospace / Astronautics History', 'Top 10 Engineering Undergrad', 'Co-op Program & Industry Placement']
  },
  {
    id: 'penn-state',
    name: 'Penn State University (University Park)',
    shortName: 'Penn State',
    category: 'safety',
    location: 'University Park, PA',
    setting: 'College Town',
    acceptanceRate: '55.0%',
    middleSat: '1230 - 1430',
    middleAct: '27 - 33',
    avgGpa: '3.65 - 3.90',
    undergradEnrollment: '40,639',
    tuition: '$19,286 (In-State) / $39,626 (Out-of-State)',
    popularMajors: ['Engineering', 'Smeal College of Business', 'Information Sciences & Technology', 'Nursing', 'Kinesiology'],
    deadlineEA_ED: 'Nov 1 (Early Action)',
    deadlineRD: 'Dec 1 (Priority) / Rolling thereafter',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: false,
      avgFinancialAid: '$11,000 / yr',
      aidNote: 'Merit and need scholarships awarded upon application review.'
    },
    requirements: {
      applicationSystem: 'Common App / MyPennState',
      supplementCount: '1 optional personal statement / honors college essay if applying to Schreyer',
      testingPolicy: 'Test-Optional',
      recsRequired: 'Optional (Self-Reported Academic Record SRAR used)',
      interviewPolicy: 'None'
    },
    overview: 'Massive Big Ten research university with one of the largest active alumni associations in the world, renowned for THON and the Schreyer Honors College.',
    admissionsStrategyTip: 'Penn State values GPA heavily (2/3 of admission weight). Applying Early Action to the University Park campus gives the best chance for direct admission.',
    keyStrengths: ['Schreyer Honors College', 'Largest Dues-Paying Alumni Network', 'Smeal College of Business', 'THON Philanthropy & Spirit']
  },
  {
    id: 'uw-seattle',
    name: 'University of Washington',
    shortName: 'UW (Seattle)',
    category: 'target',
    location: 'Seattle, WA',
    setting: 'Urban',
    acceptanceRate: '48.0% (Paul G. Allen CS: ~9%)',
    middleSat: '1300 - 1500',
    middleAct: '29 - 34',
    avgGpa: '3.80 (UW)',
    undergradEnrollment: '36,000',
    tuition: '$12,643 (In-State) / $41,997 (Out-of-State)',
    popularMajors: ['Paul G. Allen School of CS & Engineering', 'Biochemistry', 'Informatics', 'Foster School of Business', 'Bioengineering'],
    deadlineEA_ED: 'None',
    deadlineRD: 'Nov 15 (Single Application Deadline)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: false,
      avgFinancialAid: '$16,000 / yr',
      aidNote: 'Husky Promise guarantees full tuition for low-income WA state residents.'
    },
    requirements: {
      applicationSystem: 'Common App',
      supplementCount: '1 Personal Essay (650 words) + 1 Diversity/Community prompt (300 words)',
      testingPolicy: 'Test-Optional / Test-Blind for admissions',
      recsRequired: 'Not accepted or reviewed',
      interviewPolicy: 'None'
    },
    overview: 'Pacific Northwest flagship adjacent to Microsoft and Amazon headquarters, world-renowned for the Paul G. Allen School of Computer Science & Engineering.',
    admissionsStrategyTip: 'Direct to Major for Computer Science is essential for Allen School. Write a strong, personal diversity/community essay detailing specific community contributions.',
    keyStrengths: ['Paul G. Allen School of CS', 'Proximity to Amazon, Microsoft, Boeing', 'Foster School of Business', 'Beautiful Cherry Blossom Campus']
  },
  {
    id: 'tamu',
    name: 'Texas A&M University (College Station)',
    shortName: 'Texas A&M',
    category: 'safety',
    location: 'College Station, TX',
    setting: 'College Town',
    acceptanceRate: '62.0%',
    middleSat: '1170 - 1380',
    middleAct: '25 - 31',
    avgGpa: '3.70 (UW)',
    undergradEnrollment: '57,000',
    tuition: '$13,239 (In-State) / $40,134 (Out-of-State)',
    popularMajors: ['Engineering (Entry to a Major ETAM)', 'Mays Business School', 'Biomedical Sciences', 'Agriculture', 'Computer Science'],
    deadlineEA_ED: 'Oct 15 (Engineering Early Action)',
    deadlineRD: 'Dec 1 (Regular Decision)',
    financialAid: {
      needBlindDomestic: true,
      needBlindIntl: false,
      meetsFullNeed: false,
      avgFinancialAid: '$13,500 / yr',
      aidNote: 'Aggie Assurance covers tuition for in-state families under $60k.'
    },
    requirements: {
      applicationSystem: 'Common App / ApplyTexas',
      supplementCount: '1 essay + short answers on reasons for major',
      testingPolicy: 'Test-Optional',
      recsRequired: 'Up to 2 optional letters',
      interviewPolicy: 'None'
    },
    overview: 'Massive Tier-1 research university renowned for fierce school pride ("Aggie Spirit"), Corps of Cadets, and top-tier engineering network worldwide.',
    admissionsStrategyTip: 'Applying early is critical for popular majors like Mays Business and Engineering, which fill spots on a rolling priority basis.',
    keyStrengths: ['Aggie Alumni Network', 'Entry to a Major (ETAM) Engineering', 'Mays Business School', 'Tier-1 Research Facilities']
  }
];

export function getUniversityInfoByName(name: string): UniversityInfo | undefined {
  const cleanName = name.toLowerCase().trim();
  return UNIVERSITIES_DATABASE.find(
    (u) =>
      u.name.toLowerCase().includes(cleanName) ||
      cleanName.includes(u.name.toLowerCase()) ||
      cleanName.includes(u.shortName.toLowerCase()) ||
      u.shortName.toLowerCase().includes(cleanName)
  );
}
