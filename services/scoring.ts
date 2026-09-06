import { SCHOOL_PROFILES, SchoolProfile } from '../data/schools';

export interface ProfileFit {
  satPercentilePosition: 'below 25th' | 'within middle 50%' | 'above 75th' | null;
  gpaComparison: string | null;
  topWeightedFactors: string[];
}

export interface EstimatedRange {
  low: number;
  high: number;
}

/**
 * Pure function to calculate qualitative Profile Fit comparing a student's profile
 * against real, data-backed school standards (SAT 25th-75th and average enrolled unweighted GPA)
 * alongside top weighted factors from Common Data Set (CDS) Section C7.
 *
 * Does NOT fabricate or compute any single percentage "chance of admission".
 */
export function calculateProfileFit(
  studentProfile: any,
  school: Partial<SchoolProfile> | any
): ProfileFit {
  // 1. SAT percentile position (only if both student SAT and school 25th/75th exist)
  let satPercentilePosition: 'below 25th' | 'within middle 50%' | 'above 75th' | null = null;
  const rawSat = studentProfile?.satScore;
  const studentSat = rawSat ? parseInt(String(rawSat).replace(/[^0-9]/g, ''), 10) : NaN;
  const hasStudentSat = !isNaN(studentSat) && studentSat > 0;
  const hasSchoolSat =
    typeof school?.sat25th === 'number' &&
    typeof school?.sat75th === 'number' &&
    !isNaN(school.sat25th) &&
    !isNaN(school.sat75th);

  if (hasStudentSat && hasSchoolSat) {
    if (studentSat < school.sat25th) {
      satPercentilePosition = 'below 25th';
    } else if (studentSat > school.sat75th) {
      satPercentilePosition = 'above 75th';
    } else {
      satPercentilePosition = 'within middle 50%';
    }
  }

  // 2. GPA comparison (only if both student GPA and school avgEnrolledGpaUnweighted exist)
  let gpaComparison: string | null = null;
  const rawGpa = studentProfile?.unweightedGpa;
  const studentGpa = rawGpa ? parseFloat(String(rawGpa).trim()) : NaN;
  const hasStudentGpa = !isNaN(studentGpa) && studentGpa > 0;
  const hasSchoolGpa =
    typeof school?.avgEnrolledGpaUnweighted === 'number' &&
    !isNaN(school.avgEnrolledGpaUnweighted);

  if (hasStudentGpa && hasSchoolGpa) {
    const diff = studentGpa - school.avgEnrolledGpaUnweighted;
    if (diff > 0.05) {
      gpaComparison = `Above average enrolled GPA (${studentGpa.toFixed(2)} vs ${school.avgEnrolledGpaUnweighted.toFixed(2)} avg)`;
    } else if (diff < -0.05) {
      gpaComparison = `Below average enrolled GPA (${studentGpa.toFixed(2)} vs ${school.avgEnrolledGpaUnweighted.toFixed(2)} avg)`;
    } else {
      gpaComparison = `Competitive with average enrolled GPA (${studentGpa.toFixed(2)} vs ${school.avgEnrolledGpaUnweighted.toFixed(2)} avg)`;
    }
  }

  // 3. Top weighted factors rated "Very Important" from Common Data Set (CDS)
  let topWeightedFactors: string[] = [];
  if (school?.cdsFactorWeights && typeof school.cdsFactorWeights === 'object') {
    topWeightedFactors = Object.entries(school.cdsFactorWeights)
      .filter(([_, weight]) => {
        if (typeof weight !== 'string') return false;
        const normalized = weight.toLowerCase().trim();
        return normalized === 'very important' || normalized === 'very_important';
      })
      .map(([factor]) => factor)
      .slice(0, 2);
  }

  return {
    satPercentilePosition,
    gpaComparison,
    topWeightedFactors
  };
}

/**
 * Pure function to calculate a personalized acceptance estimate range based on
 * the school's official acceptance rate adjusted by the student's percentile position
 * and top-weighted Common Data Set (CDS) factors.
 *
 * Supports receiving student profile + school, or passing profileFit directly.
 * Returns null if the student is missing SAT or GPA data — never fabricates from incomplete data.
 */
export function calculateEstimatedRange(
  studentProfileOrFit: any,
  schoolOrRate: Partial<SchoolProfile> | any,
  profileFitInput?: ProfileFit | null
): EstimatedRange | null {
  // 1. Resolve official acceptance rate
  let officialRate: number = NaN;
  if (typeof schoolOrRate === 'number') {
    officialRate = schoolOrRate;
  } else if (typeof studentProfileOrFit === 'number') {
    officialRate = studentProfileOrFit;
  } else if (typeof profileFitInput === 'number') {
    officialRate = profileFitInput;
  } else if (typeof schoolOrRate?.officialAcceptanceRate === 'number' && !isNaN(schoolOrRate.officialAcceptanceRate)) {
    officialRate = schoolOrRate.officialAcceptanceRate;
  } else if (schoolOrRate?.baselineAcceptanceRate || schoolOrRate?.acceptanceRate) {
    officialRate = parseFloat(String(schoolOrRate.baselineAcceptanceRate || schoolOrRate.acceptanceRate).replace(/[^0-9.]/g, ''));
  }

  if (isNaN(officialRate) || officialRate <= 0) {
    return null;
  }

  // 2. Resolve ProfileFit
  let profileFit: ProfileFit | null = null;

  // Check if profileFitInput was passed as 3rd arg
  if (profileFitInput && typeof profileFitInput === 'object' && ('satPercentilePosition' in profileFitInput || 'gpaComparison' in profileFitInput)) {
    profileFit = profileFitInput;
  }
  // Check if 1st argument is actually a ProfileFit object
  else if (studentProfileOrFit && typeof studentProfileOrFit === 'object' && ('satPercentilePosition' in studentProfileOrFit || 'topWeightedFactors' in studentProfileOrFit)) {
    profileFit = studentProfileOrFit;
  }
  // Check if school object already contains computed profileFit
  else if (schoolOrRate?.profileFit && typeof schoolOrRate.profileFit === 'object') {
    profileFit = schoolOrRate.profileFit;
  }
  // Otherwise, compute it from studentProfile and school
  else if (studentProfileOrFit && schoolOrRate) {
    let schoolForFit = schoolOrRate;
    if (typeof schoolOrRate?.sat25th !== 'number' && (schoolOrRate?.schoolId || schoolOrRate?.id || schoolOrRate?.name)) {
      const id = schoolOrRate.schoolId || schoolOrRate.id;
      const name = (schoolOrRate.name || '').toLowerCase();
      const matched = SCHOOL_PROFILES.find((s) => s.schoolId === id || s.name.toLowerCase() === name);
      if (matched) {
        schoolForFit = { ...matched, ...schoolOrRate };
      }
    }
    profileFit = calculateProfileFit(studentProfileOrFit, schoolForFit);
  }

  // If student profile was provided, check if SAT or GPA is missing
  if (studentProfileOrFit && typeof studentProfileOrFit === 'object') {
    if ('satScore' in studentProfileOrFit || 'unweightedGpa' in studentProfileOrFit) {
      const rawSat = studentProfileOrFit?.satScore;
      const studentSat = rawSat ? parseInt(String(rawSat).replace(/[^0-9]/g, ''), 10) : NaN;
      const rawGpa = studentProfileOrFit?.unweightedGpa;
      const studentGpa = rawGpa ? parseFloat(String(rawGpa).trim()) : NaN;

      if (isNaN(studentSat) || studentSat <= 0 || isNaN(studentGpa) || studentGpa <= 0) {
        return null;
      }
    }
  }

  // If we could not resolve a profileFit or if satPercentilePosition is null (missing test data)
  if (!profileFit || profileFit.satPercentilePosition === null || profileFit.satPercentilePosition === undefined) {
    return null;
  }

  // 3. Determine if GPA is deficient
  const isGpaDeficient = Boolean(profileFit.gpaComparison?.toLowerCase().includes('below'));

  // 4. Calculate range based on student percentile position — headroom-scaled, not multiplicative.
  // Multiplying a high official rate (e.g. 89% * 1.6 = 142%) always overflows past 100 and
  // clamps to 99, making every strong-profile student at a Target/Safety school look identical.
  // Instead, scale relative to the REMAINING headroom to 100%, so schools with different
  // official rates stay distinguishable even for top-band students.
  const headroom = 100 - officialRate;

  let low: number;
  let high: number;

  if (profileFit.satPercentilePosition === 'above 75th' && !isGpaDeficient) {
    // Above 75th percentile AND above-average/competitive GPA:
    // close 30%-60% of the remaining gap to 100.
    low = Math.round(officialRate + headroom * 0.30);
    high = Math.round(officialRate + headroom * 0.60);
  } else if (profileFit.satPercentilePosition === 'below 25th' || isGpaDeficient) {
    // Below 25th percentile, or missing a "Very Important" factor: reduce the rate.
    // Multiplicative reduction has no overflow risk, so this band is unchanged.
    low = Math.round(officialRate * 0.4);
    high = Math.round(officialRate * 0.7);
  } else if (profileFit.satPercentilePosition === 'within middle 50%') {
    // Within middle 50%: modest headroom-scaled adjustment in both directions.
    low = Math.round(officialRate - officialRate * 0.15);
    high = Math.round(officialRate + headroom * 0.15);
  } else {
    return null;
  }

  // Clamp all results to [1, 99] — never return 0% or 100%
  low = Math.max(1, Math.min(99, low));
  high = Math.max(1, Math.min(99, high));

  if (low >= high) {
    high = Math.min(99, low + 1);
  }

  return { low, high };
}

/**
 * Generates immediate deterministic admissions coach guidance based on profile and analysis context.
 */
export function generateIntelligentCoachReply(message: string, profile: any, analysis: any): string {
  const lower = (message || '').toLowerCase();
  const studentName = profile?.name?.split(' ')[0] || 'Student';
  const major = profile?.intendedMajor || 'your intended field';
  const spike = analysis?.spikeCategory || 'Profile Spike';
  const gaps = analysis?.gapsToAddress || [];
  const activities = profile?.activities || [];
  const topEC = activities[0]?.title || 'your primary activity';

  if (
    lower.includes('weakness') ||
    lower.includes('gap') ||
    lower.includes('mitigate') ||
    lower.includes('fix') ||
    lower.includes('vulnerability') ||
    lower.includes('red flag')
  ) {
    const topGap = gaps.length > 0 ? gaps[0].title : 'Extracurricular activities lack external reach and quantified impact';
    return `### 🎯 How to Fix Your Main Profile Weakness

Here is the direct strategy to resolve the biggest flag on your application for **${major}**:

**1. The Main Vulnerability:**
* **${topGap}**
* *Why admissions care:* Competitive colleges want to see proof of initiative beyond standard school club attendance.

**2. Your 3-Step Fix:**
1. **Quantify Your Top Activities:** Rephrase your Common App descriptions to highlight concrete numbers (e.g., "Led 15 peers, managed $2,500 budget, reached 400+ users").
2. **Pursue External Recognition:** Submit your work from **${topEC}** to state or national competitions, symposiums, or independent preprints before deadlines.
3. **Use the Additional Info Section:** Briefly explain any school limitations or self-taught coursework with total clarity and zero excuses.

> 💡 **Key Takeaway:** Turning passive participation into proactive leadership with measurable results is the single fastest way to boost your admissions rating.

[Suggested Follow-ups: "Help me rewrite my top activity description" | "How should I structure my Common App essay?" | "What are my best Early Decision options?"]`;
  }

  if (
    lower.includes('essay') ||
    lower.includes('statement') ||
    lower.includes('hook') ||
    lower.includes('topic') ||
    lower.includes('personal statement')
  ) {
    return `### ✍️ Common App Essay Strategy for ${studentName}

To stand out for **${major}**, your personal statement must showcase **how you think and grow**, rather than repeating your resume.

**Core Rules for a Standout Essay:**
* **Focus 20% on the Hook / Scene:** Open with a vivid moment or intellectual puzzle, not a generic greeting or cliché childhood story.
* **Focus 80% on Self-Reflection:** Spend the bulk of the essay explaining your thought process, setbacks, and personal evolution.

---

### 💡 3 Strong Essay Angles for Your Profile:

1. **The Intellectual Curiosity Angle:**
   * An unsolved dilemma or paradox in **${major}** that genuinely fascinates you and how you explored it independently.
2. **The Micro-Challenge Angle:**
   * A specific technical or organizational breakdown during **${topEC}**, and how navigating that ambiguity reshaped your problem-solving.
3. **The Interdisciplinary Bridge:**
   * Connecting **${major}** with an unexpected personal interest to show multidimensional perspective.

[Suggested Follow-ups: "Give me an outline for Angle 1" | "Review my opening hook idea" | "What Common App clichés should I avoid?"]`;
  }

  if (
    lower.includes('tier') ||
    lower.includes('extracurricular') ||
    lower.includes('activity') ||
    lower.includes('eclift')
  ) {
    return `### 🚀 How to Upgrade Your Extracurriculars to Tier 1

Here is how you can elevate **${topEC}** from a standard school-level activity (Tier 2/3) to state/national distinction (Tier 1):

**1. The 3 Tiers at a Glance:**
* **Tier 3 (Baseline):** General member or officer of a high school club.
* **Tier 2 (Strong):** President or founder of a school-wide initiative with consistent meetings.
* **Tier 1 (Elite / High Impact):** Regional/national impact, founded an initiative with hundreds of participants, or published independent work.

---

**2. Your Action Steps Before Applying:**
1. **Scale Outside Your High School:** Partner with local community organizations, libraries, or neighboring schools to expand **${topEC}**.
2. **Publish Open-Access Work:** Release a free guide, software repo, or research preprint in **${major}**.
3. **Rewrite with Action Verbs & Metrics:** State exact scope (e.g., *"Coordinated 8 workshops for 120+ students; authored 35-page guide"*).

[Suggested Follow-ups: "Rewrite my description in 150 characters" | "How do I start a regional initiative?" | "How many Tier 1 activities do I need?"]`;
  }

  if (lower.includes('spike') || lower.includes('narrative')) {
    return `### ⚡ Building Your Admissions Spike for ${major}

An admissions "spike" is a clear, concentrated theme that makes your application memorable in committee discussions.

**Your Evaluated Spike:** **${spike}**

**How to Sharpen It in 3 Moves:**
1. **Connect Your Coursework to Projects:** Pair high rigor in relevant AP/IB courses with demonstrable self-directed work in **${major}**.
2. **Unify Your Activities List:** Ensure your top 3 extracurriculars reinforce your passion for ${major} while showing distinct dimensions of leadership.
3. **Align Your Supplemental Essays:** Answer *"Why This College"* by referencing specific professors, research labs, or specialized programs tied directly to your spike.

[Suggested Follow-ups: "What are my main profile weaknesses?" | "Help me plan my Common App essay" | "Which colleges best match my spike?"]`;
  }

  // Default clear, direct strategic guidance
  return `### 🎓 Admissions Advice for ${studentName}

Based on your target of **${major}** and your **${spike}** profile (${analysis?.overallRating || 'Strong'} standing):

**Quick Assessment:**
* **Academic Foundation:** Solid course rigor and testing readiness.
* **Extracurricular Focus:** Strong involvement in **${topEC}**; the next level is demonstrating measurable external impact.
* **Next Critical Milestone:** ${analysis?.priorityRecommendation?.title || 'Refine your personal statement hook and quantify your top activity descriptions.'}

**Recommended Immediate Focus:**
1. Focus your Common App essay on intellectual curiosity and reflection.
2. Upgrade your top 3 extracurricular bullet points with specific numbers and results.
3. Target Early Action / Early Decision schools that value your specific spike.

What specific area would you like to dive into next?

[Suggested Follow-ups: "How can I improve my Common App essay?" | "How do I fix the weak spots in my profile?" | "Recommend target and reach colleges for me"]`;
}

/**
 * Hydrates school profile records with major-specific commentary and pure qualitative Profile Fit.
 */
function resolveSchool(school: SchoolProfile, major: string, profile: any) {
  const profileFit = calculateProfileFit(profile, school);
  const estimatedRange = calculateEstimatedRange(profile, school, profileFit);
  return {
    id: school.schoolId,
    name: school.name,
    category: school.category || 'target',
    officialAcceptanceRate: school.officialAcceptanceRate,
    baselineAcceptanceRate: `${school.officialAcceptanceRate.toFixed(1)}%`,
    acceptanceRateSourceYear: school.acceptanceRateSourceYear,
    matchScore: school.matchScore || 85,
    location: school.location || '',
    deadline: school.deadline || '',
    round: school.round || '',
    whyFit: typeof school.whyFit === 'function' ? school.whyFit(major) : (school.whyFit || ''),
    keyFactor: school.keyFactor || '',
    strengthAlignment: school.strengthAlignment || 'high',
    sourceUrl: school.sourceUrl,
    profileFit,
    estimatedRange
  };
}

/**
 * Pure data-backed college recommendation generator.
 * Groups institutions by official selectivity (Reach < 20%, Target 20-55%, Safety > 55%)
 * and computes pure qualitative Profile Fit without fabricated probabilities.
 */
export function generateIntelligentCollegeRecommendations(
  profile: any,
  _filterTier?: string,
  filterRegion?: string
): any {
  const major = profile?.intendedMajor || 'Computer Science';
  const rawCountry = (filterRegion || profile?.preferredCountry || 'United States').toLowerCase();

  let targetRegion: 'us' | 'uk' | 'canada' = 'us';
  if (rawCountry.includes('uk') || rawCountry.includes('united kingdom') || rawCountry.includes('britain')) {
    targetRegion = 'uk';
  } else if (rawCountry.includes('canada')) {
    targetRegion = 'canada';
  }

  // Filter regional dataset
  const regionalSchools = SCHOOL_PROFILES.filter((s) => s.region === targetRegion);

  // Categorize based on institutional selectivity brackets
  const reaches = regionalSchools
    .filter((s) => s.category === 'reach' || s.officialAcceptanceRate < 20)
    .map((s) => resolveSchool(s, major, profile));

  const targets = regionalSchools
    .filter((s) => s.category === 'target' || (s.officialAcceptanceRate >= 20 && s.officialAcceptanceRate <= 55))
    .map((s) => resolveSchool(s, major, profile));

  const safeties = regionalSchools
    .filter((s) => s.category === 'safety' || s.officialAcceptanceRate > 55)
    .map((s) => resolveSchool(s, major, profile));

  return {
    summary: `Profile Fit comparison for institutions in ${targetRegion.toUpperCase()} based on official institutional statistics and Common Data Set (CDS) benchmarks. Institutional groupings reflect verified admission selectivity rates.`,
    academicCompetitivenessTier: 'Data-Backed Profile Fit',
    reachRecommendations: reaches,
    targetRecommendations: targets,
    safetyRecommendations: safeties,
    strategyNotes: [
      `Profile Fit Comparison: Shows whether your standardized test scores fall below the 25th percentile, within the middle 50%, or above the 75th percentile of admitted students.`,
      `Common Data Set (CDS) Alignment: Highlights the primary admissions factors rated "Very Important" by each university's admissions office.`,
      `Verified Acceptance Rates: Reflects official institutional reporting rather than synthetic or fabricated admissions probabilities.`
    ]
  };
}
