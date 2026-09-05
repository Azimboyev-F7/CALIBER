import { UserProfile, AnalysisResult } from '../types';

export const INITIAL_USER_PROFILE: UserProfile = {
  name: 'Alex Student',
  avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDq6N8soOtgV0LMiRchFgyw_qkYFfG__Aj7sSAxnnlTUUzFyjhXEGBHN9p-8meJHzUX_yLtcbjIDc-4Fsk91Srd-DWvmRb4YNSVQ2WkkcChxFK2qaTeyhQ8NXS3pNNmBV8YlrPlu4UBihtWTHePKgtHAC1CKtbhOSLZt4VfnXKZniCtmZ30Xl6EDh3zCtX-yzyl2Rvd8LzL4U5cBK-K5g5R3BexljEvdVVas4ejPlQnVKpgeO8oe2R_',
  unweightedGpa: '3.85',
  weightedGpa: '4.2',
  apIbHonorsCount: '10',
  satScore: '1520',
  actScore: '34',
  ieltsScore: '7.5',
  preferredCountry: 'United States',
  budgetPerYear: '$25,000 - $45,000 / yr',
  intendedMajor: 'cs',
  graduationYear: '2026',
  lastAnalyzedDate: 'Oct 24',
  contextNotes: 'Passionate about integrating autonomous machine learning algorithms into assistive robotics for seniors.',
  activities: [
    {
      id: 'act-1',
      title: 'Varsity Debate Team',
      role: 'Team Captain',
      category: 'Speech & Debate',
      hoursPerWeek: 12,
      isLeadership: true,
      tier: 2,
      description: 'Lead 24 debaters through weekly policy preparation, won 1st at Regional Invitational.',
      accentColor: 'tertiary'
    },
    {
      id: 'act-2',
      title: 'Robotics Club',
      role: 'Lead Programmer',
      category: 'STEM',
      hoursPerWeek: 8,
      isLeadership: true,
      tier: 2,
      description: 'Programmed autonomous computer vision routines in C++ for FIRST Tech Challenge robot.',
      accentColor: 'secondary'
    },
    {
      id: 'act-3',
      title: 'Math Honor Society (Mu Alpha Theta)',
      role: 'Vice President',
      category: 'Academic Club',
      hoursPerWeek: 4,
      isLeadership: true,
      tier: 3,
      description: 'Organize peer-tutoring sessions for 60+ underclassmen in AP Calculus and Precalculus.',
      accentColor: 'primary'
    },
    {
      id: 'act-4',
      title: 'Local Food Bank Volunteer',
      role: 'Weekend Volunteer Coordinator',
      category: 'Community Service',
      hoursPerWeek: 3,
      isLeadership: false,
      tier: 4,
      description: 'Sorted and packaged 5,000+ lbs of fresh produce for underserved local families.',
      accentColor: 'secondary'
    }
  ],
  awards: [
    {
      id: 'awd-1',
      title: 'National Merit Scholar Semifinalist',
      level: 'National',
      year: '2025',
      description: 'Top 1% score on PSAT/NMSQT among 1.5M test takers nationally.'
    },
    {
      id: 'awd-2',
      title: 'State Science Fair - 1st Place Physics',
      level: 'State',
      year: '2024',
      description: 'Presented novel research on optical quantum sensors; qualified for ISEF.'
    },
    {
      id: 'awd-3',
      title: 'USA Computing Olympiad (USACO) - Silver Division',
      level: 'National',
      year: '2024',
      description: 'Demonstrated proficiency in algorithmic graph theory and dynamic programming.'
    }
  ],
  targetColleges: [
    {
      id: 'col-1',
      name: 'MIT',
      category: 'reach',
      acceptanceRate: '3.9%',
      baselineAcceptanceRate: '3.9%',
      estimatedAdmitRate: '1.0%',
      location: 'Cambridge, MA',
      deadline: 'Nov 1',
      round: 'Early Action (EA)',
      status: 'in_progress',
      notes: 'Focus on Maker Portfolio & STEM research supplemental answers.',
      checklist: [
        { id: 'chk-1', label: 'Common App / MIT Part 1 & 2', completed: true },
        { id: 'chk-2', label: 'Research & Maker Portfolio', completed: true },
        { id: 'chk-3', label: 'Supplemental Short Essays (4)', completed: false },
        { id: 'chk-4', label: 'Math/Science Teacher Recs', completed: true },
        { id: 'chk-5', label: 'Official Transcript Upload', completed: true }
      ]
    },
    {
      id: 'col-2',
      name: 'Stanford University',
      category: 'reach',
      acceptanceRate: '3.6%',
      baselineAcceptanceRate: '3.6%',
      estimatedAdmitRate: '0.9%',
      location: 'Stanford, CA',
      deadline: 'Nov 1',
      round: 'Restrictive Early Action (REA)',
      status: 'in_progress',
      notes: 'Highlight interdisciplinary quantum optics + community leadership.',
      checklist: [
        { id: 'chk-1', label: 'Common App Personal Essay', completed: true },
        { id: 'chk-2', label: 'Letter to Future Roommate', completed: true },
        { id: 'chk-3', label: 'Intellectual Vitality Essay', completed: false },
        { id: 'chk-4', label: 'Counselor & Teacher Recs', completed: true }
      ]
    },
    {
      id: 'col-3',
      name: 'Harvard University',
      category: 'reach',
      acceptanceRate: '3.4%',
      baselineAcceptanceRate: '3.4%',
      estimatedAdmitRate: '0.9%',
      location: 'Cambridge, MA',
      deadline: 'Jan 1',
      round: 'Regular Decision (RD)',
      status: 'not_started',
      notes: 'Backup RD reach application.',
      checklist: [
        { id: 'chk-1', label: 'Common App Profile & Activities', completed: false },
        { id: 'chk-2', label: 'Harvard Supplemental Essay', completed: false },
        { id: 'chk-3', label: 'Optional Additional Info', completed: false }
      ]
    },
    {
      id: 'col-4',
      name: 'UC Berkeley (EECS)',
      category: 'reach',
      acceptanceRate: '11.4%',
      baselineAcceptanceRate: '11.4%',
      estimatedAdmitRate: '6.8%',
      location: 'Berkeley, CA',
      deadline: 'Nov 30',
      round: 'Regular Decision (RD)',
      status: 'ready',
      notes: 'UC Application 4 PIQs drafted and peer-reviewed.',
      checklist: [
        { id: 'chk-1', label: 'UC Application Academic History', completed: true },
        { id: 'chk-2', label: '4 Personal Insight Questions (PIQs)', completed: true },
        { id: 'chk-3', label: '20 Extracurricular Descriptions', completed: true },
        { id: 'chk-4', label: 'Final Proofread & Review', completed: true }
      ]
    },
    {
      id: 'col-5',
      name: 'University of Michigan (CoE)',
      category: 'target',
      acceptanceRate: '17.7%',
      baselineAcceptanceRate: '17.7%',
      estimatedAdmitRate: '19.5%',
      location: 'Ann Arbor, MI',
      deadline: 'Nov 1',
      round: 'Early Action (EA)',
      status: 'submitted',
      notes: 'Application submitted on Oct 20. Portal verified.',
      checklist: [
        { id: 'chk-1', label: 'Common App Submission', completed: true },
        { id: 'chk-2', label: 'Why Michigan Essay', completed: true },
        { id: 'chk-3', label: 'Why Engineering Supplement', completed: true },
        { id: 'chk-4', label: 'Test Scores Sent', completed: true }
      ]
    },
    {
      id: 'col-6',
      name: 'Georgia Tech',
      category: 'target',
      acceptanceRate: '15.0%',
      baselineAcceptanceRate: '15.0%',
      estimatedAdmitRate: '9.0%',
      location: 'Atlanta, GA',
      deadline: 'Oct 15',
      round: 'Early Action 1 (EA1)',
      status: 'submitted',
      notes: 'EA Application completed and portal confirmed.',
      checklist: [
        { id: 'chk-1', label: 'Common App & Contribution Essay', completed: true },
        { id: 'chk-2', label: 'High School Self-Reported Grades', completed: true },
        { id: 'chk-3', label: 'SAT Official Score Report', completed: true }
      ]
    },
    {
      id: 'col-7',
      name: 'Purdue University',
      category: 'safety',
      acceptanceRate: '50.3%',
      baselineAcceptanceRate: '50.3%',
      estimatedAdmitRate: '57.8%',
      location: 'West Lafayette, IN',
      deadline: 'Nov 1',
      round: 'Early Action (EA)',
      status: 'accepted',
      notes: 'Priority deadline candidate for Honors College consideration.',
      checklist: [
        { id: 'chk-1', label: 'Common App & Purdue Supplement', completed: true },
        { id: 'chk-2', label: 'Honors College Essays', completed: true },
        { id: 'chk-3', label: 'Decision Received - Admitted!', completed: true }
      ]
    }
  ],
  analysisHistory: [
    {
      id: 'eval-1',
      date: 'Jun 2025',
      timestamp: new Date(2025, 5, 1).getTime(),
      overallScore: 64,
      academicRigorScore: 78,
      extracurricularDepthScore: 58,
      narrativeCohesionScore: 54,
      leadershipScore: 56,
      honorsScore: 50,
      testingReadinessScore: 72,
      benchmarkTargetScore: 88,
      keyMilestoneEvent: 'Baseline Diagnostic Profile (Sophomore/Junior Summer Audit)',
      overallRating: 'Developing',
      notes: 'Initial evaluation; 4 honors, no state awards yet, preparing for PSAT.'
    },
    {
      id: 'eval-2',
      date: 'Sep 2025',
      timestamp: new Date(2025, 8, 15).getTime(),
      overallScore: 72,
      academicRigorScore: 82,
      extracurricularDepthScore: 68,
      narrativeCohesionScore: 62,
      leadershipScore: 66,
      honorsScore: 64,
      testingReadinessScore: 84,
      benchmarkTargetScore: 88,
      keyMilestoneEvent: 'State Science Fair 1st Place + Robotics Lead Programmer Role',
      overallRating: 'Competitive',
      notes: 'Added STEM optical sensor research + First Tech Challenge computer vision.'
    },
    {
      id: 'eval-3',
      date: 'Dec 2025',
      timestamp: new Date(2025, 11, 20).getTime(),
      overallScore: 79,
      academicRigorScore: 86,
      extracurricularDepthScore: 74,
      narrativeCohesionScore: 66,
      leadershipScore: 78,
      honorsScore: 76,
      testingReadinessScore: 92,
      benchmarkTargetScore: 88,
      keyMilestoneEvent: 'Official SAT 1520 Score + Elected Debate Team Captain',
      overallRating: 'Strong',
      notes: 'Major spike jump in standardized testing percentile and speech leadership.'
    },
    {
      id: 'eval-4',
      date: 'Mar 2026',
      timestamp: new Date(2026, 2, 10).getTime(),
      overallScore: 83,
      academicRigorScore: 88,
      extracurricularDepthScore: 76,
      narrativeCohesionScore: 70,
      leadershipScore: 84,
      honorsScore: 82,
      testingReadinessScore: 94,
      benchmarkTargetScore: 88,
      keyMilestoneEvent: 'National Merit Scholar Semifinalist + USACO Silver',
      overallRating: 'Strong',
      notes: 'External national validations secured in mathematics & algorithms.'
    }
  ]
};

export const INITIAL_ANALYSIS_RESULT: AnalysisResult = {
  overallRating: 'Strong',
  aiInsight: '"Your profile shows impressive depth in STEM and research. Focusing on a leadership role in your senior year could elevate you to Standout."',
  academicRigorScore: 88,
  extracurricularDepthScore: 74,
  narrativeCohesionScore: 68,
  academicPercentileText: 'Top 12% among peers applying to target schools.',
  ecPercentileText: 'Solid foundation, requires more focused leadership.',
  spikeCategory: 'RESEARCH + LEADERSHIP',
  spikeDescription: 'Your combination of competitive science fair wins and student government roles defines your profile. This intersection of rigorous academic inquiry and community influence is highly attractive to top-tier institutions.',
  keyStrengths: [
    {
      title: 'AP Course Load',
      description: 'Maximized available rigorous courses.'
    },
    {
      title: 'State-Level Awards',
      description: 'Two major science fair placements.'
    },
    {
      title: 'Consistent Activity',
      description: '3+ years in primary extracurriculars.'
    }
  ],
  gapsToAddress: [
    {
      title: 'No community service',
      suggestion: 'Consider 20+ hours of local volunteering aligned with your interests (e.g., tutoring STEM).'
    },
    {
      title: 'Lacking Letters of Rec Strategy',
      suggestion: 'Identify 2 teachers this semester and cultivate relationships through office hours.'
    }
  ],
  immediateNextSteps: [
    {
      id: 'step-1',
      text: 'Draft initial list of 10-12 target colleges.',
      completed: false
    },
    {
      id: 'step-2',
      text: 'Contact local science center for summer volunteering opportunities.',
      completed: false
    },
    {
      id: 'step-3',
      text: 'Review Common App essay prompts and brainstorm 3 core narratives.',
      completed: false
    }
  ],
  priorityRecommendation: {
    title: 'Strengthen Narrative Cohesion',
    description: 'Your individual achievements are strong, but the thematic connection between your Robotics Club leadership and your local community service project is unclear. Consider drafting an essay outline that bridges these interests.'
  }
};

export function computeLocalAnalysis(profile: UserProfile): AnalysisResult {
  const gpa = parseFloat(profile.unweightedGpa) || 3.5;
  const apCount = parseInt(profile.apIbHonorsCount, 10) || 4;
  const sat = parseInt(profile.satScore, 10) || 1400;

  // Calculate academic rigor
  let academicScore = 65;
  if (gpa >= 3.9) academicScore += 18;
  else if (gpa >= 3.7) academicScore += 14;
  else if (gpa >= 3.5) academicScore += 10;

  if (apCount >= 10) academicScore += 15;
  else if (apCount >= 6) academicScore += 10;
  else academicScore += 5;

  if (sat >= 1530) academicScore += 10;
  else if (sat >= 1480) academicScore += 7;
  else if (sat >= 1400) academicScore += 4;
  academicScore = Math.min(98, Math.max(50, academicScore));

  // Calculate extracurricular depth
  const totalHours = profile.activities.reduce((acc, a) => acc + (a.hoursPerWeek || 0), 0);
  const leadershipCount = profile.activities.filter(a => a.isLeadership).length;
  const nationalAwards = profile.awards.filter(a => a.level === 'National' || a.level === 'International').length;
  const stateAwards = profile.awards.filter(a => a.level === 'State' || a.level === 'Regional').length;

  let ecScore = 55;
  if (totalHours >= 20) ecScore += 15;
  else if (totalHours >= 12) ecScore += 10;
  else ecScore += 5;

  if (leadershipCount >= 2) ecScore += 14;
  else if (leadershipCount >= 1) ecScore += 8;

  if (nationalAwards >= 1) ecScore += 15;
  else if (stateAwards >= 1) ecScore += 10;
  ecScore = Math.min(96, Math.max(45, ecScore));

  // Calculate narrative cohesion
  let cohesionScore = 60;
  if (profile.activities.some(a => a.category === 'STEM') && profile.intendedMajor.toLowerCase().includes('cs')) {
    cohesionScore += 12;
  }
  if (profile.awards.length >= 2) cohesionScore += 8;
  if (leadershipCount >= 2) cohesionScore += 8;
  cohesionScore = Math.min(95, Math.max(50, cohesionScore));

  let overallRating: 'Exceptional' | 'Strong' | 'Competitive' | 'Developing' = 'Competitive';
  const avg = (academicScore + ecScore + cohesionScore) / 3;
  if (avg >= 86) overallRating = 'Strong';
  if (avg >= 92) overallRating = 'Exceptional';
  if (avg < 72) overallRating = 'Developing';

  return {
    overallRating,
    aiInsight: `"Your profile shows impressive depth in ${profile.intendedMajor.toUpperCase()} and extracurricular initiatives. Focusing on narrative cohesion and elevating senior leadership will position you strongly for top-tier admissions."`,
    academicRigorScore: academicScore,
    extracurricularDepthScore: ecScore,
    narrativeCohesionScore: cohesionScore,
    academicPercentileText: `Top ${Math.max(4, Math.round(100 - academicScore * 0.95))}% among peers applying to target schools.`,
    ecPercentileText: totalHours >= 15 ? 'Solid foundation, demonstrates impactful continuity.' : 'Growing foundation, requires more focused leadership.',
    spikeCategory: leadershipCount >= 2 ? 'RESEARCH + LEADERSHIP' : 'TECHNICAL INQUIRY & SCHOLARSHIP',
    spikeDescription: `Your combination of ${profile.awards[0]?.title || 'competitive academic milestones'} and key extracurricular commitments defines your profile. This focus is highly attractive to admissions committees.`,
    keyStrengths: [
      {
        title: apCount >= 8 ? 'AP Course Load' : 'Academic Foundation',
        description: `Completed ${apCount} rigorous advanced courses.`
      },
      {
        title: profile.awards.length > 0 ? `${profile.awards[0].level}-Level Recognition` : 'Dedicated Focus',
        description: profile.awards[0]?.title || 'Multi-year commitment in core clubs.'
      },
      {
        title: 'Consistent Activity',
        description: `${totalHours} hrs/wk dedicated across key pursuits.`
      }
    ],
    gapsToAddress: [
      {
        title: profile.activities.some(a => a.category === 'Community Service') ? 'Expand Community Impact' : 'No community service',
        suggestion: 'Consider 20+ hours of local volunteering aligned with your interests (e.g., tutoring STEM).'
      },
      {
        title: 'Lacking Letters of Rec Strategy',
        suggestion: 'Identify 2 teachers this semester and cultivate relationships through office hours.'
      }
    ],
    immediateNextSteps: [
      {
        id: 'step-1',
        text: 'Draft initial list of 10-12 target colleges.',
        completed: false
      },
      {
        id: 'step-2',
        text: 'Contact local science center for summer volunteering opportunities.',
        completed: false
      },
      {
        id: 'step-3',
        text: 'Review Common App essay prompts and brainstorm 3 core narratives.',
        completed: false
      }
    ],
    priorityRecommendation: {
      title: 'Strengthen Narrative Cohesion',
      description: `Your achievements are strong, but the thematic connection between your ${profile.activities[0]?.title || 'extracurriculars'} and your major (${profile.intendedMajor}) can be woven into a clearer central narrative.`
    }
  };
}
