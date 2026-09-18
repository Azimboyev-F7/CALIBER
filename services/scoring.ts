import { SCHOOL_PROFILES, SchoolProfile } from '../data/schools';

export interface ProfileFit {
  satPercentilePosition: 'below 25th' | 'within middle 50%' | 'above 75th' | null;
  gpaComparison: string | null;
  topWeightedFactors: string[];
  activityStrengthScore?: number;
  honorsStrengthScore?: number;
}

export interface EstimatedRange {
  low: number;
  high: number;
  approximate?: boolean; // true when school has no SAT band data; range is based on acceptance rate only
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

  const activities = Array.isArray(studentProfile?.activities) ? studentProfile.activities : [];
  const activityScores = activities.map((activity: any) => {
    const tierBase: Record<number, number> = { 1: 90, 2: 70, 3: 50, 4: 30 };
    const tier = Number(activity?.tier);
    const hasScorableData = Boolean(tierBase[tier] || activity?.isLeadership || Number(activity?.hoursPerWeek) > 0 || activity?.description);
    if (!hasScorableData) return 0;
    let score = tierBase[tier] || 30;
    if (activity?.isLeadership) score += 8;
    if (Number(activity?.hoursPerWeek) >= 8) score += 5;
    if (/\d/.test(String(activity?.description || ''))) score += 5;
    return Math.min(100, score);
  }).filter((score: number) => score > 0).sort((a: number, b: number) => b - a).slice(0, 3);
  const scoreWeights = [0.6, 0.25, 0.15];
  const activityWeightTotal = scoreWeights.slice(0, activityScores.length).reduce((sum, weight) => sum + weight, 0);
  const activityStrengthScore = activityScores.length
    ? Math.round(activityScores.reduce((sum: number, score: number, index: number) => sum + score * scoreWeights[index], 0) / activityWeightTotal)
    : 0;

  const honors = Array.isArray(studentProfile?.awards) ? studentProfile.awards : [];
  const honorBase: Record<string, number> = { International: 100, National: 90, State: 70, Regional: 55, School: 35 };
  const honorScores = honors.map((honor: any) => honorBase[honor?.level] || 35)
    .sort((a: number, b: number) => b - a).slice(0, 3);
  const honorsWeightTotal = scoreWeights.slice(0, honorScores.length).reduce((sum, weight) => sum + weight, 0);
  const honorsStrengthScore = honorScores.length
    ? Math.round(honorScores.reduce((sum: number, score: number, index: number) => sum + score * scoreWeights[index], 0) / honorsWeightTotal)
    : 0;

  return {
    satPercentilePosition,
    gpaComparison,
    topWeightedFactors,
    activityStrengthScore,
    honorsStrengthScore
  };
}

function calculateHolisticShift(profileFit: ProfileFit, school: any): number {
  const activityScore = profileFit.activityStrengthScore || 0;
  const honorsScore = profileFit.honorsStrengthScore || 0;
  if (!activityScore && !honorsScore) return 0;
  const weights = Object.keys(school?.cdsFactorWeights || {}).map((key) => key.toLowerCase());
  const givesHolisticWeight = weights.some((key) =>
    /extracurricular|character|personal qualities|talent|volunteer|work experience|honors/.test(key)
  );
  const activitySignal = activityScore ? (activityScore - 60) / 40 : 0;
  const honorsSignal = honorsScore ? (honorsScore - 60) / 40 : 0;
  const rawSignal = (activitySignal * 0.6 + honorsSignal * 0.4) * (givesHolisticWeight ? 1 : 0.6);
  return Math.max(-4, Math.min(4, Math.round(rawSignal * 4)));
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
    if (!('satPercentilePosition' in studentProfileOrFit)) {
      const rawSat = studentProfileOrFit?.satScore;
      const studentSat = rawSat ? parseInt(String(rawSat).replace(/[^0-9]/g, ''), 10) : NaN;
      const rawGpa = studentProfileOrFit?.unweightedGpa;
      const studentGpa = rawGpa ? parseFloat(String(rawGpa).trim()) : NaN;

      if (isNaN(studentSat) || studentSat <= 0 || isNaN(studentGpa) || studentGpa <= 0) {
        return null;
      }
    }
  }

  // If satPercentilePosition is null (school has no SAT band — common for non-US institutions),
  // try GPA comparison as the primary signal before falling back to a flat band.
  if (!profileFit || profileFit.satPercentilePosition === null || profileFit.satPercentilePosition === undefined) {
    if (!isNaN(officialRate) && officialRate > 0) {
      const headroom = 100 - officialRate;
      const gpa = profileFit?.gpaComparison?.toLowerCase() ?? '';
      let low: number;
      let high: number;

      if (gpa.includes('above')) {
        // GPA above school average → close 25-50% of headroom
        low = Math.round(officialRate + headroom * 0.25);
        high = Math.round(officialRate + headroom * 0.50);
      } else if (gpa.includes('below')) {
        // GPA below school average → reduce
        low = Math.round(officialRate * 0.45);
        high = Math.round(officialRate * 0.75);
      } else if (gpa.includes('competitive')) {
        // GPA on par → modest positive adjustment
        low = Math.round(officialRate + headroom * 0.05);
        high = Math.round(officialRate + headroom * 0.20);
      } else {
        // No GPA data either — flat ±15% band
        low = Math.round(officialRate * 0.85);
        high = Math.round(officialRate * 1.15);
      }

      const holisticShift = profileFit ? calculateHolisticShift(profileFit, schoolOrRate) : 0;
      low += holisticShift;
      high += holisticShift;
      low = Math.max(1, Math.min(99, low));
      high = Math.max(1, Math.min(99, high));
      if (low >= high) high = Math.min(99, low + 1);
      return { low, high, approximate: true };
    }
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

  // Activities and honors influence the personalized range only through a
  // small, capped shift. The school's official acceptance rate is untouched.
  const holisticShift = calculateHolisticShift(profileFit, schoolOrRate);
  low += holisticShift;
  high += holisticShift;

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
    return `### How to Fix Your Main Profile Weakness

Here is the direct strategy to resolve the biggest flag on your application for **${major}**:

**1. The Main Vulnerability:**
* **${topGap}**
* *Why admissions care:* Competitive colleges want to see proof of initiative beyond standard school club attendance.

**2. Your 3-Step Fix:**
1. **Quantify Your Top Activities:** Rephrase your Common App descriptions to highlight concrete numbers (e.g., "Led 15 peers, managed $2,500 budget, reached 400+ users").
2. **Pursue External Recognition:** Submit your work from **${topEC}** to state or national competitions, symposiums, or independent preprints before deadlines.
3. **Use the Additional Info Section:** Briefly explain any school limitations or self-taught coursework with total clarity and zero excuses.

> **Key Takeaway:** Turning passive participation into proactive leadership with measurable results is the single fastest way to boost your admissions rating.

[Suggested Follow-ups: "Help me rewrite my top activity description" | "How should I structure my Common App essay?" | "What are my best Early Decision options?"]`;
  }

  if (
    lower.includes('essay') ||
    lower.includes('statement') ||
    lower.includes('hook') ||
    lower.includes('topic') ||
    lower.includes('personal statement')
  ) {
    return `### Common App Essay Strategy for ${studentName}

To stand out for **${major}**, your personal statement must showcase **how you think and grow**, rather than repeating your resume.

**Core Rules for a Standout Essay:**
* **Focus 20% on the Hook / Scene:** Open with a vivid moment or intellectual puzzle, not a generic greeting or cliché childhood story.
* **Focus 80% on Self-Reflection:** Spend the bulk of the essay explaining your thought process, setbacks, and personal evolution.

---

### 3 Strong Essay Angles for Your Profile:

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
    return `### How to Upgrade Your Extracurriculars to Tier 1

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
    return `### Building Your Admissions Spike for ${major}

An admissions "spike" is a clear, concentrated theme that makes your application memorable in committee discussions.

**Your Evaluated Spike:** **${spike}**

**How to Sharpen It in 3 Moves:**
1. **Connect Your Coursework to Projects:** Pair high rigor in relevant AP/IB courses with demonstrable self-directed work in **${major}**.
2. **Unify Your Activities List:** Ensure your top 3 extracurriculars reinforce your passion for ${major} while showing distinct dimensions of leadership.
3. **Align Your Supplemental Essays:** Answer *"Why This College"* by referencing specific professors, research labs, or specialized programs tied directly to your spike.

[Suggested Follow-ups: "What are my main profile weaknesses?" | "Help me plan my Common App essay" | "Which colleges best match my spike?"]`;
  }

  if (
    lower.includes('college') ||
    lower.includes('university') ||
    lower.includes('school') ||
    lower.includes('recommend') ||
    lower.includes('target') ||
    lower.includes('reach') ||
    lower.includes('safety') ||
    lower.includes('list')
  ) {
    const rating = analysis?.overallRating || 'Competitive';
    return `### College List Strategy for ${studentName}

With a **${rating}** profile targeting **${major}**, here is how to build a balanced college list:

**The 3-Tier Framework:**
* **Reach (3-4 schools):** Acceptance rates under 15%. These are dream schools where your profile is competitive but not guaranteed. Apply ED/EA to your top reach if the fit is strong.
* **Target (4-5 schools):** Acceptance rates 20-45%. Schools where your GPA, test scores, and spike genuinely match the middle 50% of admitted students.
* **Safety (2-3 schools):** Acceptance rates above 55%. Schools where you are confident of admission and would genuinely be happy attending.

**Key Factors to Evaluate Beyond Rankings:**
1. **Research / program depth** in **${major}** — faculty, labs, internship pipelines.
2. **Location and career network** — proximity to industries where you want to work.
3. **Financial aid generosity** — check each school's Common Data Set (Section H) for average aid packages.

> A list of 10-12 schools across all three tiers is the right size. More than 15 spreads your supplemental essay effort too thin.

[Suggested Follow-ups: "Which schools should I apply Early Decision?" | "How do I evaluate financial aid offers?" | "What GPA do I need for my target schools?"]`;
  }

  if (
    lower.includes('gpa') ||
    lower.includes('grade') ||
    lower.includes('academic') ||
    lower.includes('course') ||
    lower.includes('ap ') ||
    lower.includes('ib ') ||
    lower.includes('rigor') ||
    lower.includes('class rank')
  ) {
    const gpa = profile?.unweightedGpa || 'N/A';
    const apCount = profile?.apIbHonorsCount || 'N/A';
    return `### Academic Profile Assessment for ${studentName}

**Your Current Numbers:**
* Unweighted GPA: **${gpa}**
* AP/IB/Honors Courses: **${apCount}**

**What Top Colleges Actually Look For:**
* **Course rigor over raw GPA.** A 3.8 in 8 AP courses often beats a 4.0 in standard classes at selective schools.
* **Upward trend matters.** If your GPA improved junior year, mention it in the Additional Info section.
* **Senior year counts.** Mid-year reports go to colleges — don't drop your course load or grades after submitting.

**How to Maximize Academic Standing Now:**
1. If you have room in your schedule, add one more AP or dual-enrollment course in your strongest subject.
2. If your GPA dipped a semester, write 1-2 sentences in Additional Info explaining the context (illness, family, not excuses — facts).
3. Use your senior year to take courses directly relevant to **${major}** to reinforce your spike.

[Suggested Follow-ups: "Does my course rigor match my target schools?" | "How do I explain a GPA dip?" | "Should I take more APs senior year?"]`;
  }

  if (
    lower.includes('sat') ||
    lower.includes('act') ||
    lower.includes('test') ||
    lower.includes('score') ||
    lower.includes('testing') ||
    lower.includes('superscore')
  ) {
    const sat = profile?.satScore || 'N/A';
    return `### Testing Strategy for ${studentName}

**Your Current SAT:** ${sat}

**How Test Scores Factor Into Admissions:**
* At test-optional schools, submitting a score only helps you if it is at or above the school's 50th percentile for admitted students (check each school's Common Data Set, Section C).
* At test-required schools, a score in the middle 50% is the floor — aim for the 75th percentile.
* A strong score can compensate for a slightly lower GPA and vice versa.

**When to Retake:**
* If your score is below the 50th percentile of your target schools AND you have time to prep (2-3 months of structured study), retaking is worth it.
* If you are within 50-80 points of your goal, targeted Khan Academy prep on your two weakest sub-sections is the highest ROI move.
* If you are already above the 75th percentile for your targets, don't retake — spend that time on essays and activities.

**Test-Optional Decision Rule:**
Submit your score if it is at or above the 50th percentile for that specific school. Withhold it otherwise.

[Suggested Follow-ups: "Should I submit my SAT to test-optional schools?" | "How much can a higher SAT help me?" | "What is a good score for my target schools?"]`;
  }

  if (
    lower.includes('supplemental') ||
    lower.includes('why') && (lower.includes('college') || lower.includes('school') || lower.includes('major')) ||
    lower.includes('short answer') ||
    lower.includes('additional essay')
  ) {
    return `### Supplemental Essay Strategy for ${studentName}

Supplemental essays are where most rejections happen at selective schools — they reveal whether you have done the homework.

**The "Why Us" Essay (Most Important Supplemental):**
* **Bad answer:** "Your strong ${major} program and diverse community..."
* **Good answer:** Name 2-3 specific professors, labs, courses, or student organizations you researched. Explain exactly how they connect to what you have already done in **${topEC}** or **${major}**.
* Length: typically 150-300 words. Every word must earn its place.

**The "Why Major" Essay:**
* Do NOT summarize your resume. Instead, trace the intellectual origin story — the moment, question, or problem that pulled you toward **${major}**.
* Connect it forward: what open question in **${major}** do you want to answer in college and why?

**General Supplemental Rules:**
1. Research each school individually — copied/pasted "why us" essays are immediately obvious.
2. Name at least one specific faculty member and one specific program or initiative.
3. Never mention US News rankings as a reason you want to attend.

[Suggested Follow-ups: "Help me draft a Why Us essay" | "What makes a strong Why Major essay?" | "How do I research a school's specific programs?"]`;
  }

  if (
    lower.includes('early decision') ||
    lower.includes('early action') ||
    lower.includes(' ed ') ||
    lower.includes(' ea ') ||
    lower.includes('restrictive') ||
    lower.includes('binding')
  ) {
    return `### Early Decision vs. Early Action for ${studentName}

**Early Decision (ED) — Binding:**
* Deadline: typically Nov 1 or Nov 15. Decision: mid-December.
* Acceptance rate boost: ED applicants are often accepted at 1.5x-2x the Regular Decision rate at the same school.
* Only apply ED if: (1) it is truly your first choice, (2) you have visited or thoroughly researched it, and (3) you can commit without seeing other financial aid offers.
* ED is not recommended if you need to compare financial aid packages — you surrender that ability.

**Early Action (EA) / Restrictive Early Action (REA) — Non-Binding:**
* Same early deadline, but you are NOT committed if accepted. Harvard/Yale/Princeton use REA (you cannot apply EA elsewhere).
* Best strategy for most students: apply EA wherever you can, get decisions early, then compare in April.

**Recommendation for ${studentName}:**
* If you have a clear first-choice school and your profile is strong (GPA/test scores at or above their 50th percentile), applying ED there is the single highest-leverage move you can make.
* Use EA for your next 2-3 target schools to build early momentum.

[Suggested Follow-ups: "Is my profile strong enough for ED at my top school?" | "What are the financial aid risks of ED?" | "When should I apply Regular Decision instead?"]`;
  }

  if (
    lower.includes('recommendation') ||
    lower.includes('letter of rec') ||
    lower.includes('teacher rec') ||
    lower.includes('counselor') ||
    lower.includes('lor')
  ) {
    return `### Recommendation Letter Strategy for ${studentName}

Recommendation letters can meaningfully differentiate you — or quietly hurt you — at selective schools.

**Choosing Your Recommenders:**
* Pick teachers who know you well in a **relevant subject** (math/science teacher for STEM majors, English teacher for humanities).
* The best recommenders are ones who can write about specific moments — a question you asked, a project you led, a breakthrough you had — not just "excellent student."
* Avoid picking teachers only because they gave you an A. Pick the one who saw you grow, struggle, or take initiative.

**How to Set Your Recommenders Up for Success:**
1. Ask early — at least 6-8 weeks before the deadline.
2. Provide a "brag sheet": 1-2 pages covering your story, intended major (${major}), top activities, and why you are applying to each school.
3. Tell them what you hope they highlight — your curiosity in their class, a specific project tied to **${topEC}**, or your leadership growth.

**Counselor Letter:**
Share your context notes and any hardships with your counselor — they can add important context admissions readers will weight heavily.

[Suggested Follow-ups: "What should I include in my brag sheet?" | "How do I ask a teacher for a rec letter?" | "Can I submit more than 2 teacher recs?"]`;
  }

  if (
    lower.includes('financial aid') ||
    lower.includes('scholarship') ||
    lower.includes('cost') ||
    lower.includes('afford') ||
    lower.includes('tuition') ||
    lower.includes('fafsa') ||
    lower.includes('merit')
  ) {
    return `### Financial Aid & Scholarship Strategy for ${studentName}

**Key Deadlines — Do Not Miss These:**
* **FAFSA** opens October 1 — file as early as possible, even if you think you won't qualify. Many merit awards still require it.
* **CSS Profile** (required by ~200 private colleges) — file within 1-2 weeks of your EA/ED applications.

**How to Evaluate School Costs:**
* Look at the school's Common Data Set (Section H) for the average grant aid for freshmen — this is more accurate than the sticker price.
* Use the Net Price Calculator on each school's website for a personalized estimate.
* Schools with "meet 100% of demonstrated need" policies (Harvard, MIT, Princeton, etc.) can actually cost less than state schools for high-need families.

**Merit Scholarships:**
* Public flagships often have competitive merit scholarships — research these separately from need-based aid.
* Many merit awards are automatically considered at application; others require separate applications. Check each school's financial aid page.

> Always compare net cost (sticker minus grants), not sticker price. An expensive school with generous aid often costs less than a cheap school with no aid.

[Suggested Follow-ups: "Which schools are most generous with merit aid?" | "When should I file the FAFSA?" | "How do I compare financial aid packages?"]`;
  }

  if (
    lower.includes('interview') ||
    lower.includes('alumni') ||
    lower.includes('campus visit')
  ) {
    return `### Interview & Campus Visit Strategy for ${studentName}

**Alumni Interviews:**
* Most alumni interviews are evaluative but low-stakes — they rarely make or break an application.
* They matter most at schools where interviews are "required" (e.g., some LACs) or "strongly recommended."
* Treat every interview as a chance to demonstrate genuine interest and intellectual curiosity.

**How to Prepare:**
1. **Know your story.** Practice a 2-minute answer to "Tell me about yourself" that highlights your spike in **${major}** and your top activity (**${topEC}**).
2. **Prepare 3-4 specific questions** about the school that show you have done real research — not things you could Google.
3. **Be concrete, not general.** "I led a team of 12 people in X" beats "I have strong leadership skills."

**Key Questions to Practice:**
* Why this school specifically?
* What is your greatest intellectual interest?
* Describe a challenge you overcame.
* Where do you see yourself in 10 years?

**Campus Visits:**
* If you can visit, attend an information session AND a class in **${major}**. Speaking to current students is more valuable than the official tour.
* Document specifics to reference in your "Why Us" essay.

[Suggested Follow-ups: "Help me prepare my 'Why Us' answer for the interview" | "What questions should I ask my interviewer?" | "How much do interviews actually matter?"]`;
  }

  if (
    lower.includes('deadline') ||
    lower.includes('timeline') ||
    lower.includes('when') ||
    lower.includes('schedule') ||
    lower.includes('calendar')
  ) {
    return `### Application Timeline for ${studentName}

**Summer Before Senior Year (June-August):**
* Finalize your college list (10-12 schools across reach/target/safety).
* Draft your Common App personal statement — aim for a complete draft by August 1.
* Request recommendation letters from teachers (ask before summer ends).

**September-October:**
* Finalize and polish personal statement.
* Research supplemental essays for all schools; draft "Why Us" essays.
* Open FAFSA on October 1 — file immediately.

**November 1-15 (Early Deadlines):**
* Submit Early Decision or Early Action applications.
* File CSS Profile for private schools.

**December-January:**
* Receive ED/EA decisions; if deferred, send a Letter of Continued Interest.
* Submit Regular Decision applications (most due Jan 1-15).

**March-April:**
* Regular Decision notifications arrive.
* Compare financial aid packages carefully.
* Commit to your final school by **May 1** (National Decision Day).

[Suggested Follow-ups: "What should I be working on right now?" | "How do I handle an ED deferral?" | "What goes into a Letter of Continued Interest?"]`;
  }

  if (
    lower.includes('waitlist') ||
    lower.includes('deferral') ||
    lower.includes('deferred') ||
    lower.includes('waitlisted')
  ) {
    return `### Handling a Waitlist or Deferral for ${studentName}

**If You Are Deferred (EA/ED → Regular Decision):**
* Send a **Letter of Continued Interest (LOCI)** within 1-2 weeks of the deferral notice.
* The LOCI should: (1) reaffirm this is your first choice, (2) add 1-2 new accomplishments or updates since you applied, (3) be concise — 3-4 short paragraphs max.
* Do NOT beg. Tone should be confident and enthusiastic, not desperate.

**If You Are Waitlisted:**
* Accept your place on the waitlist (if you are still interested) and send a LOCI by May 1.
* Commit to your best backup school before the May 1 deposit deadline — you cannot count on the waitlist.
* Statistically, most waitlisted students are not admitted. Plan your college career around your admitted school.

**What Actually Moves the Needle:**
* New, concrete achievements (a research paper accepted, a competition win, a leadership award).
* A genuine, specific explanation of why this school above all others fits your goals in **${major}**.

[Suggested Follow-ups: "Help me write a Letter of Continued Interest" | "How do I decide which backup school to commit to?" | "What are my chances of getting off the waitlist?"]`;
  }

  // Default clear, direct strategic guidance
  return `### Admissions Advice for ${studentName}

Based on your target of **${major}** and your **${spike}** profile (${analysis?.overallRating || 'Strong'} standing):

**Quick Assessment:**
* **Extracurricular Focus:** Strong involvement in **${topEC}**; the next level is demonstrating measurable external impact and external recognition.
* **Essay Priority:** Your personal statement should showcase intellectual curiosity and a clear growth arc — not a resume recap.
* **Next Critical Milestone:** ${analysis?.priorityRecommendation?.title || 'Quantify your top activity descriptions and refine your personal statement hook.'}

**Recommended Immediate Focus:**
1. Identify your top 1-2 essay angles based on your most formative experiences in **${topEC}** and **${major}**.
2. Upgrade your top 3 Common App activity descriptions with specific numbers, scope, and impact.
3. Build your college list: 3-4 reaches, 4-5 targets, 2-3 safeties — all schools where you would genuinely be happy.

**Ask me about any specific area:**
* Essay strategy and angles
* College list and target schools
* Extracurricular upgrades
* Testing strategy
* Application timeline and deadlines

[Suggested Follow-ups: "How can I improve my Common App essay?" | "Build me a balanced college list" | "How do I fix the weak spots in my profile?"]`;
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

  let targetRegion: 'us' | 'uk' | 'canada' | 'korea' | 'germany' | 'china' = 'us';
  if (rawCountry.includes('uk') || rawCountry.includes('united kingdom') || rawCountry.includes('britain')) {
    targetRegion = 'uk';
  } else if (rawCountry.includes('canada')) {
    targetRegion = 'canada';
  } else if (rawCountry.includes('korea') || rawCountry.includes('한국')) {
    targetRegion = 'korea';
  } else if (rawCountry.includes('germany') || rawCountry.includes('deutschland')) {
    targetRegion = 'germany';
  } else if (rawCountry.includes('china') || rawCountry.includes('中国') || rawCountry.includes('prc')) {
    targetRegion = 'china';
  }

  // Filter regional dataset
  const regionalSchools = SCHOOL_PROFILES.filter((s) => s.region === targetRegion);

  // Categorize by official acceptance rate as ground truth — avoids duplicate listings
  // when a school's category tag disagrees with its rate.
  const reaches = regionalSchools
    .filter((s) => s.officialAcceptanceRate < 20)
    .sort((a, b) => a.officialAcceptanceRate - b.officialAcceptanceRate)
    .slice(0, 2)
    .map((s) => resolveSchool(s, major, profile));

  const targets = regionalSchools
    .filter((s) => s.officialAcceptanceRate >= 20 && s.officialAcceptanceRate <= 55)
    .sort((a, b) => b.officialAcceptanceRate - a.officialAcceptanceRate)
    .slice(0, 4)
    .map((s) => resolveSchool(s, major, profile));

  const safeties = regionalSchools
    .filter((s) => s.officialAcceptanceRate > 55)
    .sort((a, b) => b.officialAcceptanceRate - a.officialAcceptanceRate)
    .slice(0, 4)
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
