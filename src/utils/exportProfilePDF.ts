import { jsPDF } from 'jspdf';
import { UserProfile, AnalysisResult } from '../types';

interface ExportPDFOptions {
  filename?: string;
  onProgress?: (status: string) => void;
}

export async function generateProfilePDFDoc(
  profile: UserProfile,
  analysis: AnalysisResult,
  options: { onProgress?: (status: string) => void } = {}
): Promise<jsPDF> {
  const { onProgress } = options;
  onProgress?.('Initializing PDF document...');

  // Initialize jsPDF (A4 portrait, mm units)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = 210;
  const pageHeight = 297;
  const marginX = 14;
  const marginTop = 18;
  const marginBottom = 18;
  const contentWidth = pageWidth - marginX * 2; // 182 mm
  let currentY = marginTop;

  // Caliber Dark Mode Color Palette
  const colors = {
    // Deep Obsidian Canvas & Card Panels
    bgDark: [11, 15, 25] as [number, number, number],       // #0b0f19 - Deep Obsidian Canvas
    bgCard: [19, 27, 46] as [number, number, number],       // #131b2e - Primary Card Panel
    bgCardAlt: [15, 23, 42] as [number, number, number],    // #0f172a - Secondary / Table Inset
    bgCardHover: [30, 41, 59] as [number, number, number],  // #1e293b - Highlighted Container
    bgCardDark: [13, 18, 32] as [number, number, number],   // #0d1220 - Dark Well / Track

    // Clean Dark Borders
    borderSubtle: [33, 44, 67] as [number, number, number], // #212c43 - Structural borders
    borderMid: [51, 65, 85] as [number, number, number],    // #334155 - Defined borders
    borderGlow: [99, 102, 241] as [number, number, number], // #6366f1 - Indigo brand border
    borderPurple: [168, 85, 247] as [number, number, number],// #a855f7 - Purple brand border

    // Brand Gradients & Accents
    primary: [99, 102, 241] as [number, number, number],     // Indigo 500
    primaryLight: [30, 27, 75] as [number, number, number],  // Dark Indigo 950
    purpleAccent: [168, 85, 247] as [number, number, number],// Purple 500
    purpleDark: [38, 20, 59] as [number, number, number],    // Dark Purple Inset
    fuchsiaAccent: [217, 70, 239] as [number, number, number],// Fuchsia 500

    // High-Contrast Fonts & Text
    textPrimary: [255, 255, 255] as [number, number, number], // Pure crisp white
    textSecondary: [226, 232, 240] as [number, number, number],// Slate 200 (Body)
    textMuted: [148, 163, 184] as [number, number, number],    // Slate 400 (Labels/Meta)
    textDim: [100, 116, 139] as [number, number, number],      // Slate 500 (Footnotes)
    textAccent: [165, 180, 252] as [number, number, number],   // Indigo 300 (Subheadings)
    textPurple: [192, 132, 252] as [number, number, number],   // Purple 300 (Highlights)

    // Calibrated Indicators & Badges
    emerald: [52, 211, 153] as [number, number, number],     // Emerald 400
    emeraldBg: [13, 37, 30] as [number, number, number],     // Deep Emerald Inset
    amber: [251, 191, 36] as [number, number, number],        // Amber 400
    amberBg: [41, 29, 14] as [number, number, number],        // Deep Amber Inset
    rose: [244, 63, 94] as [number, number, number],          // Rose 400
    roseBg: [38, 16, 26] as [number, number, number],         // Deep Rose Inset
    white: [255, 255, 255] as [number, number, number],
  };

  // Helper: Draw full-page Caliber Obsidian Dark Canvas
  const drawPageBackground = () => {
    doc.setFillColor(...colors.bgDark);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
  };

  // Helper: Draw Brand Indigo / Purple / Fuchsia Gradient Accent Bar
  const drawGradientBar = (x: number, y: number, width: number, height: number = 0.8) => {
    const steps = 28;
    const stepW = width / steps;
    for (let s = 0; s < steps; s++) {
      const t = s / (steps - 1);
      let r: number, g: number, b: number;
      if (t < 0.5) {
        const t1 = t / 0.5;
        r = Math.round(99 + (168 - 99) * t1);
        g = Math.round(102 + (85 - 102) * t1);
        b = Math.round(241 + (247 - 241) * t1);
      } else {
        const t2 = (t - 0.5) / 0.5;
        r = Math.round(168 + (217 - 168) * t2);
        g = Math.round(85 + (70 - 85) * t2);
        b = Math.round(247 + (239 - 247) * t2);
      }
      doc.setFillColor(r, g, b);
      doc.rect(x + s * stepW, y, stepW + 0.15, height, 'F');
    }
  };

  // Helper: check page break and draw header/footer with Caliber Dark Theme
  const checkPageBreak = (neededHeight: number) => {
    if (currentY + neededHeight > pageHeight - marginBottom) {
      doc.addPage();
      drawPageBackground();
      currentY = marginTop;
      drawRunningHeader();
    }
  };

  const drawRunningHeader = () => {
    // Brand Gradient accent stripe at page top
    drawGradientBar(0, 0, pageWidth, 1.4);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...colors.textAccent);
    doc.text('CALIBER | CONFIDENTIAL ADMISSIONS DOSSIER', marginX, 10);

    doc.setTextColor(...colors.textMuted);
    doc.text(profile.name || 'Candidate Portfolio', pageWidth - marginX, 10, { align: 'right' });

    doc.setDrawColor(...colors.borderSubtle);
    doc.setLineWidth(0.25);
    doc.line(marginX, 12, pageWidth - marginX, 12);
  };

  // Helper to draw section titles with brand gradient accent
  const drawSectionHeader = (title: string, subtitle?: string) => {
    checkPageBreak(subtitle ? 19 : 15);
    
    // Left vertical brand gradient accent bar
    const barH = subtitle ? 9.5 : 7;
    drawGradientBar(marginX, currentY, 2.8, barH);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11.5);
    doc.setTextColor(...colors.textPrimary);
    doc.text(title, marginX + 6, currentY + 5.2);

    if (subtitle) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(...colors.textMuted);
      doc.text(subtitle, marginX + 6, currentY + 9.5);
      currentY += 13;
    } else {
      currentY += 8.5;
    }

    // Sleek border divider
    doc.setDrawColor(...colors.borderSubtle);
    doc.setLineWidth(0.25);
    doc.line(marginX, currentY, pageWidth - marginX, currentY);
    currentY += 4;
  };

  // Paint Obsidian Canvas on Page 1
  drawPageBackground();

  onProgress?.('Generating executive summary in Caliber dark aesthetic...');

  // ==========================================
  // PAGE 1: HEADER & CANDIDATE BANNER
  // ==========================================
  
  // Header Banner Card with dark panel & clean borders
  const bannerHeight = 44;
  doc.setFillColor(...colors.bgCard);
  doc.roundedRect(marginX, currentY, contentWidth, bannerHeight, 3, 3, 'F');
  doc.setDrawColor(...colors.borderSubtle);
  doc.setLineWidth(0.3);
  doc.roundedRect(marginX, currentY, contentWidth, bannerHeight, 3, 3, 'S');

  // Top and Left Brand Gradient Accents
  drawGradientBar(marginX, currentY, contentWidth, 1.2);
  drawGradientBar(marginX, currentY, 3.8, bannerHeight);

  // Brand tag
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.8);
  doc.setTextColor(...colors.textAccent);
  doc.text('CALIBER ADMISSIONS CONSULTING • OFFICIAL DIAGNOSTIC DOSSIER', marginX + 8, currentY + 8.5);

  // Student Name in Crisp High-Contrast White
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(...colors.textPrimary);
  doc.text(profile.name || 'Candidate Portfolio', marginX + 8, currentY + 17.5);

  // Key Profile Subtitle
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...colors.textSecondary);
  const classText = `Class of ${profile.graduationYear || '2027'}  •  Target Major: ${profile.intendedMajor || 'Undecided'}`;
  doc.text(classText, marginX + 8, currentY + 24.5);

  // Secondary details row
  doc.setFontSize(8);
  doc.setTextColor(...colors.textMuted);
  const locationText = `Target Country: ${profile.preferredCountry || 'United States'}  |  Annual Budget: ${profile.budgetPerYear || 'Flexible'}  |  Audit Date: ${new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  doc.text(locationText, marginX + 8, currentY + 31.5);

  // Status Badge on Right of banner with Indigo/Purple Styling
  const badgeW = 44;
  const badgeH = 15;
  const badgeX = pageWidth - marginX - badgeW - 3;
  const badgeY = currentY + 8;
  doc.setFillColor(...colors.primaryLight);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'F');
  doc.setDrawColor(...colors.borderPurple);
  doc.setLineWidth(0.3);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 2, 2, 'S');
  drawGradientBar(badgeX, badgeY, badgeW, 0.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...colors.textPurple);
  doc.text('OVERALL STANDING', badgeX + badgeW / 2, badgeY + 5.2, { align: 'center' });

  doc.setFontSize(9.5);
  doc.setTextColor(...colors.textPrimary);
  doc.text(analysis.overallRating.toUpperCase(), badgeX + badgeW / 2, badgeY + 11.5, { align: 'center' });

  currentY += bannerHeight + 6;

  // ==========================================
  // SECTION: KEY METRICS TILES
  // ==========================================
  const tileWidth = (contentWidth - 6) / 3;
  const tileHeight = 22;

  // Compute overall composite index
  const leadershipCount = profile.activities.filter((a) => a.isLeadership || a.tier <= 2).length;
  const leadershipScore = Math.min(96, Math.max(50, 60 + leadershipCount * 8));
  const awardsCount = profile.awards.length;
  const awardsScore = Math.min(95, Math.max(45, 55 + awardsCount * 12));
  const parsedSat = parseInt(profile.satScore, 10);
  const parsedIelts = parseFloat(profile.ieltsScore);
  let testingScore = 75;
  if (!isNaN(parsedSat) && parsedSat > 0) {
    testingScore = Math.min(99, Math.max(50, Math.round(((parsedSat - 1000) / 600) * 45 + 54)));
  } else if (!isNaN(parsedIelts) && parsedIelts > 0) {
    testingScore = Math.min(98, Math.max(50, Math.round((parsedIelts / 9) * 98)));
  }
  const compositeIndex = Math.round(
    analysis.academicRigorScore * 0.28 +
    analysis.extracurricularDepthScore * 0.26 +
    analysis.narrativeCohesionScore * 0.18 +
    leadershipScore * 0.14 +
    awardsScore * 0.08 +
    testingScore * 0.06
  );

  // Dynamic Statistical Confidence & Profile Completeness Model
  const hasGpa = Boolean(profile.unweightedGpa && parseFloat(profile.unweightedGpa) > 0);
  const hasTesting = (!isNaN(parsedSat) && parsedSat > 0) || (!isNaN(parsedIelts) && parsedIelts > 0);
  const hasMajor = Boolean(profile.intendedMajor && profile.intendedMajor.trim().length > 0);
  const hasRigor = Boolean(profile.apIbHonorsCount && parseInt(profile.apIbHonorsCount, 10) > 0);

  let academicCompleteness = (hasGpa ? 12 : 0) + (hasTesting ? 12 : 0) + (hasMajor ? 6 : 0) + (hasRigor ? 5 : 0);
  const activityCount = profile.activities?.length || 0;
  let ecCompleteness = activityCount >= 5 ? 30 : activityCount >= 3 ? 22 : activityCount === 2 ? 14 : activityCount === 1 ? 7 : 0;
  let awardsCompleteness = awardsCount >= 2 ? 15 : awardsCount === 1 ? 9 : 0;
  const collegesCount = profile.targetColleges?.length || 0;
  let collegesCompleteness = collegesCount >= 3 ? 10 : collegesCount >= 1 ? 5 : 0;
  const notesLength = profile.contextNotes?.trim().length || 0;
  let contextCompleteness = notesLength > 20 ? 10 : notesLength > 0 ? 5 : 0;

  const profileCompleteness = Math.min(
    100,
    Math.round(academicCompleteness + ecCompleteness + awardsCompleteness + collegesCompleteness + contextCompleteness)
  );
  const isLowCompleteness = profileCompleteness < 50;
  const marginOfError =
    profileCompleteness < 30
      ? '±12.0%'
      : profileCompleteness < 50
      ? '±8.5%'
      : profileCompleteness < 70
      ? '±6.0%'
      : profileCompleteness < 85
      ? '±4.5%'
      : '±3.2%';

  const confidenceScore = Math.min(96, Math.max(45, Math.round(42 + profileCompleteness * 0.54)));
  const confidenceTier = isLowCompleteness
    ? 'Preliminary'
    : confidenceScore >= 90
    ? 'High Confidence'
    : confidenceScore >= 78
    ? 'Solid Confidence'
    : 'Moderate Confidence';

  // Metric 1: Composite Profile Index
  doc.setFillColor(...colors.bgCard);
  doc.roundedRect(marginX, currentY, tileWidth, tileHeight, 2, 2, 'F');
  doc.setDrawColor(...colors.borderSubtle);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, currentY, tileWidth, tileHeight, 2, 2, 'S');
  drawGradientBar(marginX, currentY, tileWidth, 0.7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...colors.textAccent);
  doc.text('COMPOSITE PROFILE INDEX', marginX + 4, currentY + 6);
  doc.setFontSize(14);
  doc.setTextColor(...colors.textPrimary);
  doc.text(`${compositeIndex}/100`, marginX + 4, currentY + 15);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textSecondary);
  doc.text(`Rating: ${analysis.overallRating}`, marginX + 28, currentY + 15);

  // Metric 2: Academic Rigor
  const tile2X = marginX + tileWidth + 3;
  doc.setFillColor(...colors.bgCard);
  doc.roundedRect(tile2X, currentY, tileWidth, tileHeight, 2, 2, 'F');
  doc.setDrawColor(...colors.borderSubtle);
  doc.setLineWidth(0.25);
  doc.roundedRect(tile2X, currentY, tileWidth, tileHeight, 2, 2, 'S');
  drawGradientBar(tile2X, currentY, tileWidth, 0.7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...colors.textAccent);
  doc.text('ACADEMIC RIGOR & TESTING', tile2X + 4, currentY + 6);
  doc.setFontSize(14);
  doc.setTextColor(...colors.emerald);
  doc.text(`${analysis.academicRigorScore}%`, tile2X + 4, currentY + 15);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textSecondary);
  doc.text(analysis.academicPercentileText || 'Top percentile', tile2X + 24, currentY + 15);

  // Metric 3: EC & Spike Depth
  const tile3X = tile2X + tileWidth + 3;
  doc.setFillColor(...colors.bgCard);
  doc.roundedRect(tile3X, currentY, tileWidth, tileHeight, 2, 2, 'F');
  doc.setDrawColor(...colors.borderSubtle);
  doc.setLineWidth(0.25);
  doc.roundedRect(tile3X, currentY, tileWidth, tileHeight, 2, 2, 'S');
  drawGradientBar(tile3X, currentY, tileWidth, 0.7);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...colors.textAccent);
  doc.text('EXTRACURRICULAR SPIKE', tile3X + 4, currentY + 6);
  doc.setFontSize(14);
  doc.setTextColor(...colors.purpleAccent);
  doc.text(`${analysis.extracurricularDepthScore}%`, tile3X + 4, currentY + 15);
  doc.setFontSize(7.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textSecondary);
  doc.text(analysis.ecPercentileText || 'Top percentile', tile3X + 24, currentY + 15);

  currentY += tileHeight + 6;

  // ==========================================
  // SECTION: AI EXECUTIVE SUMMARY & SPIKE
  // ==========================================
  drawSectionHeader('Executive Admissions Assessment & Strategic Spike');

  // Spike Highlight Box in Dark Mode with Indigo/Purple Accents
  if (analysis.spikeCategory) {
    doc.setFillColor(...colors.bgCard);
    doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'F');
    doc.setDrawColor(...colors.borderGlow);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, currentY, contentWidth, 14, 2, 2, 'S');
    drawGradientBar(marginX, currentY, contentWidth, 0.8);
    drawGradientBar(marginX, currentY, 2.5, 14);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(...colors.textAccent);
    doc.text('IDENTIFIED ADMISSIONS SPIKE:', marginX + 5, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...colors.textPrimary);
    doc.text(analysis.spikeCategory, marginX + 56, currentY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...colors.textSecondary);
    const spikeDescLines = doc.splitTextToSize(analysis.spikeDescription || 'Clear area of distinction aligned with target curriculum.', contentWidth - 10);
    doc.text(spikeDescLines[0] || '', marginX + 5, currentY + 10.5);
    currentY += 18;
  }

  // AI Strategic Assessment Narrative
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.2);
  doc.setTextColor(...colors.textSecondary);
  const narrativeLines = doc.splitTextToSize(analysis.aiInsight || 'Holistic evaluation completed.', contentWidth);
  for (const line of narrativeLines) {
    checkPageBreak(5);
    doc.text(line, marginX, currentY);
    currentY += 4.5;
  }
  currentY += 4;

  // ==========================================
  // SECTION: APPLICANT NARRATIVE GEOMETRY (D3 RADAR POLYGON)
  // ==========================================
  onProgress?.('Rendering Applicant Narrative geometry & radar dimensions...');
  drawSectionHeader(
    'Applicant Narrative Spike Geometry',
    'Multi-dimensional vector radar mapping candidate profile against Top 20 benchmarks and national baselines'
  );

  const radarBoxHeight = 66;
  checkPageBreak(radarBoxHeight + 4);

  // Background card for Narrative Geometry in Caliber Dark Mode
  doc.setFillColor(...colors.bgCard);
  doc.roundedRect(marginX, currentY, contentWidth, radarBoxHeight, 2, 2, 'F');
  doc.setDrawColor(...colors.borderSubtle);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, currentY, contentWidth, radarBoxHeight, 2, 2, 'S');
  drawGradientBar(marginX, currentY, contentWidth, 0.7);

  // Left side: Vector Radar Chart
  const radarCenterX = marginX + 38;
  const radarCenterY = currentY + 31;
  const radarRadius = 20.5; // mm

  // Six dimensions data
  const dimensionsData = [
    { key: 'rigor', label: 'Academic Rigor', student: analysis.academicRigorScore, benchmark: 92, national: 64, rating: analysis.academicRigorScore >= 90 ? 'Tier 1 Elite' : 'Tier 2 Competitive' },
    { key: 'testing', label: 'Testing', student: testingScore, benchmark: 93, national: 56, rating: testingScore >= 90 ? '99th Percentile' : 'Competitive' },
    { key: 'narrative', label: 'Narrative Arc', student: analysis.narrativeCohesionScore, benchmark: 88, national: 50, rating: analysis.narrativeCohesionScore >= 85 ? 'High Cohesion' : 'Developing' },
    { key: 'honors', label: 'Honors & Awards', student: awardsScore, benchmark: 84, national: 46, rating: awardsScore >= 80 ? 'National/State' : 'School/Local' },
    { key: 'leadership', label: 'Leadership', student: leadershipScore, benchmark: 86, national: 58, rating: leadershipScore >= 85 ? 'Initiator/Leader' : 'Active Contrib.' },
    { key: 'spike', label: 'EC Spike', student: analysis.extracurricularDepthScore, benchmark: 88, national: 52, rating: analysis.extracurricularDepthScore >= 88 ? 'Distinct Hook' : 'Specialized' },
  ];

  const totalAxes = dimensionsData.length;
  const getRadarCoord = (val: number, axisIdx: number) => {
    const angle = (axisIdx * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const dist = (Math.max(0, Math.min(100, val)) / 100) * radarRadius;
    return {
      x: radarCenterX + dist * Math.cos(angle),
      y: radarCenterY + dist * Math.sin(angle),
    };
  };

  // Draw concentric polygonal grid rings (20%, 40%, 60%, 80%, 100%)
  const gridLevels = [20, 40, 60, 80, 100];
  doc.setLineWidth(0.15);
  doc.setDrawColor(42, 54, 78);

  gridLevels.forEach((lvl) => {
    const ringPts = Array.from({ length: totalAxes }, (_, i) => getRadarCoord(lvl, i));
    const ringLines = ringPts.slice(1).map((p, i) => [p.x - ringPts[i].x, p.y - ringPts[i].y]);
    doc.lines(ringLines, ringPts[0].x, ringPts[0].y, [1, 1], 'S', true);
  });

  // Draw radial axis lines (spokes)
  doc.setDrawColor(54, 68, 96);
  doc.setLineWidth(0.18);
  for (let i = 0; i < totalAxes; i++) {
    const outerPt = getRadarCoord(100, i);
    doc.line(radarCenterX, radarCenterY, outerPt.x, outerPt.y);
  }

  // Draw National Average polygon (dotted slate outline)
  doc.setLineDashPattern([0.8, 0.8], 0);
  doc.setDrawColor(...colors.textDim);
  doc.setLineWidth(0.25);
  const natPts = dimensionsData.map((d, i) => getRadarCoord(d.national, i));
  const natLines = natPts.slice(1).map((p, i) => [p.x - natPts[i].x, p.y - natPts[i].y]);
  doc.lines(natLines, natPts[0].x, natPts[0].y, [1, 1], 'S', true);

  // Draw Top 20 Benchmark polygon (purple dashed line)
  doc.setLineDashPattern([1.5, 1.2], 0);
  doc.setDrawColor(...colors.textPurple);
  doc.setLineWidth(0.35);
  const benchPts = dimensionsData.map((d, i) => getRadarCoord(d.benchmark, i));
  const benchLines = benchPts.slice(1).map((p, i) => [p.x - benchPts[i].x, p.y - benchPts[i].y]);
  doc.lines(benchLines, benchPts[0].x, benchPts[0].y, [1, 1], 'S', true);

  // Reset line dash pattern for candidate polygon
  doc.setLineDashPattern([], 0);

  // Draw Candidate Profile Polygon (Filled deep indigo, stroked vibrant indigo)
  doc.setFillColor(...colors.primaryLight);
  doc.setDrawColor(129, 140, 248);
  doc.setLineWidth(0.5);
  const studPts = dimensionsData.map((d, i) => getRadarCoord(d.student, i));
  const studLines = studPts.slice(1).map((p, i) => [p.x - studPts[i].x, p.y - studPts[i].y]);
  doc.lines(studLines, studPts[0].x, studPts[0].y, [1, 1], 'FD', true);

  // Draw illuminated vertex circles on candidate polygon
  doc.setFillColor(165, 180, 252);
  studPts.forEach((pt) => {
    doc.circle(pt.x, pt.y, 0.9, 'F');
  });

  // Axis labels around radar polygon with high-contrast text
  const labelOffsets = [
    { dx: 0, dy: -3.5, align: 'center' as const }, // Academic Rigor (Top)
    { dx: 3.5, dy: -1, align: 'left' as const },   // Testing (Top Right)
    { dx: 3.5, dy: 3, align: 'left' as const },    // Narrative (Bottom Right)
    { dx: 0, dy: 4.5, align: 'center' as const },  // Honors (Bottom)
    { dx: -3.5, dy: 3, align: 'right' as const },  // Leadership (Bottom Left)
    { dx: -3.5, dy: -1, align: 'right' as const }, // EC Spike (Top Left)
  ];

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  dimensionsData.forEach((dim, idx) => {
    const tipPt = getRadarCoord(100, idx);
    const offset = labelOffsets[idx];
    doc.setTextColor(...colors.textPrimary);
    doc.text(dim.label, tipPt.x + offset.dx, tipPt.y + offset.dy, { align: offset.align });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...colors.textAccent);
    doc.text(`${dim.student}%`, tipPt.x + offset.dx, tipPt.y + offset.dy + (offset.dy < 0 ? -2.2 : 2.2), { align: offset.align });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
  });

  // Radar Legend (under the radar circle)
  const legendY = currentY + radarBoxHeight - 4;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);

  // Student Profile indicator
  doc.setFillColor(129, 140, 248);
  doc.circle(marginX + 6, legendY - 0.7, 1.1, 'F');
  doc.setTextColor(...colors.textPrimary);
  doc.text('Candidate Profile', marginX + 9, legendY);

  // Top 20 Benchmark indicator
  doc.setFillColor(...colors.purpleAccent);
  doc.rect(marginX + 33, legendY - 1.2, 3, 1, 'F');
  doc.setTextColor(...colors.textPurple);
  doc.text('Top 20 Target (90%)', marginX + 38, legendY);

  // National Avg indicator
  doc.setDrawColor(...colors.textDim);
  doc.setLineDashPattern([0.6, 0.6], 0);
  doc.line(marginX + 62, legendY - 0.7, marginX + 66, legendY - 0.7);
  doc.setLineDashPattern([], 0);
  doc.setTextColor(...colors.textMuted);
  doc.text('Natl Avg (54%)', marginX + 68, legendY);

  // Right Side: 6-Dimension Scorecard & Gap Analysis Table
  const tableX = marginX + 80;
  const tableW = contentWidth - 82;
  const rowH = 7.2;

  // Header row for the table
  doc.setFillColor(...colors.bgCardHover);
  doc.rect(tableX, currentY + 3.5, tableW, 5.5, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6.5);
  doc.setTextColor(...colors.textPrimary);
  doc.text('DIMENSION', tableX + 3, currentY + 7.2);
  doc.text('SCORE', tableX + 35, currentY + 7.2);
  doc.text('BENCHMARK', tableX + 51, currentY + 7.2);
  doc.text('STATUS / RATING', tableX + 72, currentY + 7.2);

  dimensionsData.forEach((dim, idx) => {
    const ry = currentY + 9 + idx * rowH;
    if (idx % 2 === 1) {
      doc.setFillColor(...colors.bgCardAlt);
      doc.rect(tableX, ry, tableW, rowH, 'F');
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...colors.textPrimary);
    doc.text(dim.label, tableX + 3, ry + 4.6);

    // Score
    doc.setTextColor(...colors.textAccent);
    doc.text(`${dim.student}%`, tableX + 35, ry + 4.6);

    // Benchmark
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...colors.textMuted);
    doc.text(`${dim.benchmark}%`, tableX + 51, ry + 4.6);

    // Delta badge
    const delta = dim.student - dim.benchmark;
    const deltaStr = delta >= 0 ? `+${delta}%` : `${delta}%`;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6);
    if (delta >= 0) {
      doc.setTextColor(...colors.emerald);
    } else {
      doc.setTextColor(...colors.amber);
    }
    doc.text(`(${deltaStr})`, tableX + 61, ry + 4.6);

    // Rating text
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.2);
    doc.setTextColor(...colors.textSecondary);
    doc.text(dim.rating, tableX + 72, ry + 4.6);

    doc.setDrawColor(...colors.borderSubtle);
    doc.setLineWidth(0.12);
    doc.line(tableX, ry + rowH, tableX + tableW, ry + rowH);
  });

  // Summary highlight box at bottom right of the scorecard
  const highlightY = currentY + 9 + totalAxes * rowH + 1.5;
  doc.setFillColor(...colors.purpleDark);
  doc.roundedRect(tableX, highlightY, tableW, 7.5, 1.5, 1.5, 'F');
  doc.setDrawColor(...colors.borderPurple);
  doc.setLineWidth(0.25);
  doc.roundedRect(tableX, highlightY, tableW, 7.5, 1.5, 1.5, 'S');
  drawGradientBar(tableX, highlightY, tableW, 0.45);

  const strongest = dimensionsData.reduce((p, c) => (c.student > p.student ? c : p));
  const opportunity = dimensionsData.reduce((p, c) => (c.student - c.benchmark < p.student - p.benchmark ? c : p));

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(...colors.textPurple);
  doc.text('GEOMETRIC SUMMARY:', tableX + 3, highlightY + 3.2);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.8);
  doc.setTextColor(...colors.textPrimary);
  doc.text(
    `Lead Spike: ${strongest.label} (${strongest.student}%)  •  Primary Focus: ${opportunity.label} (Gap: ${opportunity.student - opportunity.benchmark}%)`,
    tableX + 3,
    highlightY + 6
  );

  currentY += radarBoxHeight + 6;

  // ==========================================
  // SECTION: ACADEMIC & TESTING PROFILE
  // ==========================================
  onProgress?.('Formatting academic metrics & testing data...');
  drawSectionHeader('Academic Record & Standardized Testing');

  // Academic Grid (4 columns)
  const acadColWidth = (contentWidth - 9) / 4;
  const acadCardHeight = 18;

  const academicItems = [
    { label: 'Unweighted GPA', val: profile.unweightedGpa ? `${profile.unweightedGpa} / 4.00` : 'Not Reported', sub: '4.00 Scale' },
    { label: 'AP / IB / Honors', val: profile.apIbHonorsCount ? `${profile.apIbHonorsCount} Courses` : 'Standard', sub: 'Course Rigor Index' },
    { label: 'SAT Score', val: profile.satScore ? `SAT: ${profile.satScore}` : 'Not Taken', sub: parsedSat >= 1500 ? '99th Percentile' : 'Standardized Testing' },
    { label: 'English Proficiency', val: profile.ieltsScore ? `IELTS: ${profile.ieltsScore}` : 'Exempt / Not Reported', sub: parsedIelts >= 7.5 ? 'Competency Met' : 'Language Assessment' },
  ];

  checkPageBreak(acadCardHeight + 2);
  academicItems.forEach((item, idx) => {
    const cardX = marginX + idx * (acadColWidth + 3);
    doc.setFillColor(...colors.bgCard);
    doc.roundedRect(cardX, currentY, acadColWidth, acadCardHeight, 2, 2, 'F');
    doc.setDrawColor(...colors.borderSubtle);
    doc.setLineWidth(0.25);
    doc.roundedRect(cardX, currentY, acadColWidth, acadCardHeight, 2, 2, 'S');
    drawGradientBar(cardX, currentY, acadColWidth, 0.6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...colors.textAccent);
    doc.text(item.label, cardX + 3.5, currentY + 5);

    doc.setFontSize(9.2);
    doc.setTextColor(...colors.textPrimary);
    doc.text(item.val, cardX + 3.5, currentY + 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.8);
    doc.setTextColor(...colors.textMuted);
    doc.text(item.sub, cardX + 3.5, currentY + 15.5);
  });
  currentY += acadCardHeight + 6;

  // ==========================================
  // SECTION: EXTRACURRICULAR ACTIVITIES (TOP PURSUITS)
  // ==========================================
  onProgress?.('Compiling extracurricular activities portfolio in Caliber dark aesthetic...');
  drawSectionHeader(
    `Extracurricular Pursuits & Leadership (${profile.activities.length} Recorded)`,
    'Detailed breakdown of candidate activities, tiers, weekly hours, and tangible impact'
  );

  if (profile.activities.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.textDim);
    doc.text('No extracurricular activities currently logged.', marginX, currentY + 3);
    currentY += 8;
  } else {
    // Activities Table Header
    checkPageBreak(12);
    doc.setFillColor(...colors.bgCardHover);
    doc.rect(marginX, currentY, contentWidth, 7, 'F');
    drawGradientBar(marginX, currentY, contentWidth, 0.6);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...colors.textPrimary);
    doc.text('ACTIVITY & ROLE', marginX + 3, currentY + 4.8);
    doc.text('CATEGORY', marginX + 85, currentY + 4.8);
    doc.text('TIER / IMPACT', marginX + 125, currentY + 4.8);
    doc.text('COMMITMENT', marginX + 158, currentY + 4.8);
    currentY += 7;

    // Iterate activities
    profile.activities.forEach((act, idx) => {
      const descLines = doc.splitTextToSize(act.description || 'No description provided.', contentWidth - 10);
      const rowHeight = 12 + descLines.length * 4;
      checkPageBreak(rowHeight + 3);

      // Alternating background with dark tones
      if (idx % 2 === 1) {
        doc.setFillColor(...colors.bgCardAlt);
        doc.rect(marginX, currentY, contentWidth, rowHeight, 'F');
      } else {
        doc.setFillColor(...colors.bgCard);
        doc.rect(marginX, currentY, contentWidth, rowHeight, 'F');
      }

      // Title & Role
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(...colors.textPrimary);
      doc.text(act.title, marginX + 3, currentY + 4.5);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...colors.textAccent);
      doc.text(`Role: ${act.role}${act.isLeadership ? '  [LEADERSHIP]' : ''}`, marginX + 3, currentY + 8.5);

      // Category
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(...colors.textMuted);
      doc.text(act.category, marginX + 85, currentY + 5.5);

      // Tier Badge
      const tierLabels: Record<number, string> = {
        1: 'Tier 1 (National/Intl)',
        2: 'Tier 2 (State/Regional)',
        3: 'Tier 3 (School/Local)',
        4: 'Tier 4 (General)',
      };
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      if (act.tier === 1) doc.setTextColor(...colors.purpleAccent);
      else if (act.tier === 2) doc.setTextColor(...colors.emerald);
      else doc.setTextColor(...colors.textSecondary);
      doc.text(tierLabels[act.tier] || `Tier ${act.tier}`, marginX + 125, currentY + 5.5);

      // Commitment
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...colors.textSecondary);
      doc.text(`${act.hoursPerWeek} hrs/wk`, marginX + 158, currentY + 5.5);

      // Activity Description
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...colors.textSecondary);
      let descY = currentY + 12;
      descLines.forEach((dLine: string) => {
        doc.text(dLine, marginX + 5, descY);
        descY += 3.8;
      });

      // Bottom separator
      doc.setDrawColor(...colors.borderSubtle);
      doc.setLineWidth(0.15);
      doc.line(marginX, currentY + rowHeight, pageWidth - marginX, currentY + rowHeight);

      currentY += rowHeight;
    });
    currentY += 5;
  }

  // ==========================================
  // SECTION: HONORS & AWARDS
  // ==========================================
  if (profile.awards.length > 0) {
    onProgress?.('Formatting honors and scholastic awards in Caliber dark aesthetic...');
    drawSectionHeader(`Honors & Scholastic Recognitions (${profile.awards.length})`);

    profile.awards.forEach((award) => {
      checkPageBreak(13);
      doc.setFillColor(...colors.bgCard);
      doc.roundedRect(marginX, currentY, contentWidth, 11, 1.5, 1.5, 'F');
      doc.setDrawColor(...colors.borderSubtle);
      doc.setLineWidth(0.25);
      doc.roundedRect(marginX, currentY, contentWidth, 11, 1.5, 1.5, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.2);
      doc.setTextColor(...colors.textPrimary);
      doc.text(award.title, marginX + 4, currentY + 4.8);

      // Level Pill
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      doc.setTextColor(...colors.emerald);
      doc.text(`[${award.level.toUpperCase()}]`, marginX + 130, currentY + 4.8);

      if (award.year) {
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(...colors.textMuted);
        doc.text(`Year: ${award.year}`, marginX + 160, currentY + 4.8);
      }

      if (award.description) {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.2);
        doc.setTextColor(...colors.textSecondary);
        doc.text(award.description, marginX + 4, currentY + 8.8);
      }

      currentY += 13;
    });
    currentY += 3;
  }

  // ==========================================
  // SECTION: ADMISSIONS ODDS SIMULATOR & CHART
  // ==========================================
  onProgress?.('Generating Admissions Odds Simulator & probability distribution chart in Caliber dark aesthetic...');
  drawSectionHeader(
    'Admissions Odds Simulator & Selectivity Model',
    'Algorithmic acceptance simulation across institutional selectivity tiers calibrated with statistical confidence'
  );

  const simBoxHeight = 65;
  checkPageBreak(simBoxHeight + 4);

  // Confidence & Margin of Error strip in Caliber Dark Mode
  doc.setFillColor(...colors.bgCard);
  doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'F');
  doc.setDrawColor(...colors.borderSubtle);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, currentY, contentWidth, 8, 1.5, 1.5, 'S');
  drawGradientBar(marginX, currentY, contentWidth, 0.6);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...colors.textAccent);
  doc.text('STATISTICAL MODEL SPECIFICATION:', marginX + 4, currentY + 5.2);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.textSecondary);
  doc.text(`Model Confidence: ${confidenceScore}% (${confidenceTier})`, marginX + 60, currentY + 5.2);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.textPurple);
  doc.text(`Margin of Error: ${marginOfError}`, marginX + 128, currentY + 5.2);

  currentY += 11;

  // VISUAL ODDS SIMULATOR COMPARATIVE HORIZONTAL CHART IN CALIBER DARK MODE
  const chartHeight = 31;
  doc.setFillColor(...colors.bgCard);
  doc.roundedRect(marginX, currentY, contentWidth, chartHeight, 2, 2, 'F');
  doc.setDrawColor(...colors.borderSubtle);
  doc.setLineWidth(0.25);
  doc.roundedRect(marginX, currentY, contentWidth, chartHeight, 2, 2, 'S');
  drawGradientBar(marginX, currentY, contentWidth, 0.6);

  // Chart Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.2);
  doc.setTextColor(...colors.textPrimary);
  doc.text('SIMULATED CANDIDATE ODDS VS. GENERAL APPLICANT POOL', marginX + 4, currentY + 5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.2);
  doc.setTextColor(...colors.textMuted);
  doc.text('(0% to 100% Selectivity Curve)', marginX + 90, currentY + 5);

  // Chart Track dimensions:
  const chartBarX = marginX + 44;
  const chartBarW = 90; // mm for 100%
  const chartBarH = 4.6;

  // Vertical grid markers at 0%, 25%, 50%, 75%, 100%
  const gridPcts = [0, 25, 50, 75, 100];
  gridPcts.forEach((pct) => {
    const gx = chartBarX + (pct / 100) * chartBarW;
    doc.setDrawColor(...colors.borderSubtle);
    doc.setLineWidth(0.15);
    doc.line(gx, currentY + 6.5, gx, currentY + 25);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.5);
    doc.setTextColor(...colors.textDim);
    doc.text(`${pct}%`, gx, currentY + 28.5, { align: 'center' });
  });

  // Tiers to draw in chart:
  const simTiers = [
    { label: 'Reach (Top 15 / Ivies)', genRate: 5, studentMin: 14, studentMax: 22, color: colors.rose, badge: '+3.8x Advantage' },
    { label: 'Target (Top 20 - 50)', genRate: 22, studentMin: 48, studentMax: 65, color: colors.amber, badge: '+2.6x Advantage' },
    { label: 'Safety (Top 50+ / State)', genRate: 58, studentMin: 85, studentMax: 94, color: colors.emerald, badge: 'High Predictability' },
  ];

  simTiers.forEach((st, idx) => {
    const rowY = currentY + 7.5 + idx * 5.8;

    // Label
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...colors.textPrimary);
    doc.text(st.label, marginX + 4, rowY + 3.4);

    // Track background (dark well)
    doc.setFillColor(...colors.bgCardDark);
    doc.roundedRect(chartBarX, rowY, chartBarW, chartBarH, 1, 1, 'F');

    // General applicant rate (dim slate bar)
    const genW = (st.genRate / 100) * chartBarW;
    doc.setFillColor(...colors.borderMid);
    doc.roundedRect(chartBarX, rowY + 0.6, genW, chartBarH - 1.2, 0.8, 0.8, 'F');

    // Student simulated range bar with vivid color
    const studStartX = chartBarX + (st.studentMin / 100) * chartBarW;
    const studW = ((st.studentMax - st.studentMin) / 100) * chartBarW;
    doc.setFillColor(...st.color);
    doc.roundedRect(studStartX, rowY, studW, chartBarH, 1, 1, 'F');

    // Numerical range text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.8);
    doc.setTextColor(...st.color);
    doc.text(`${st.studentMin}% - ${st.studentMax}%`, chartBarX + chartBarW + 4, rowY + 3.4);

    // Advantage pill
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5.8);
    doc.setTextColor(...colors.textSecondary);
    doc.text(st.badge, chartBarX + chartBarW + 24, rowY + 3.4);
  });

  currentY += chartHeight + 4;

  // 3-COLUMN SELECTIVITY TIERS CARDS IN CALIBER DARK MODE
  const simColW = (contentWidth - 6) / 3;
  const simCardH = 21;
  checkPageBreak(simCardH + 3);

  const reachesCount = profile.targetColleges.filter((c) => c.category === 'reach').length;
  const targetsCount = profile.targetColleges.filter((c) => c.category === 'target').length;
  const safetiesCount = profile.targetColleges.filter((c) => c.category === 'safety').length;

  const tierCards = [
    {
      title: 'Reach Institutions',
      odds: '14% - 22% Simulated',
      count: `${reachesCount} in list`,
      color: colors.rose,
      bgColor: colors.roseBg,
      tip: 'Acceptance hinges on unique spike distinction & exceptional supplement essays.',
    },
    {
      title: 'Target Institutions',
      odds: '48% - 65% Simulated',
      count: `${targetsCount} in list`,
      color: colors.amber,
      bgColor: colors.amberBg,
      tip: 'Academic profile aligns with 75th percentile of admitted freshmen.',
    },
    {
      title: 'Safety Institutions',
      odds: '85% - 94% Simulated',
      count: `${safetiesCount} in list`,
      color: colors.emerald,
      bgColor: colors.emeraldBg,
      tip: 'High admission predictability; prime candidate for honors & merit scholarships.',
    },
  ];

  tierCards.forEach((tc, idx) => {
    const cx = marginX + idx * (simColW + 3);
    doc.setFillColor(...tc.bgColor);
    doc.roundedRect(cx, currentY, simColW, simCardH, 2, 2, 'F');
    doc.setDrawColor(...tc.color);
    doc.setLineWidth(0.25);
    doc.roundedRect(cx, currentY, simColW, simCardH, 2, 2, 'S');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...tc.color);
    doc.text(tc.title, cx + 3.5, currentY + 4.8);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.2);
    doc.setTextColor(...colors.textMuted);
    doc.text(tc.count, cx + simColW - 3.5, currentY + 4.8, { align: 'right' });

    doc.setFontSize(8.5);
    doc.setTextColor(...colors.textPrimary);
    doc.text(tc.odds, cx + 3.5, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6);
    doc.setTextColor(...colors.textSecondary);
    const tipLines = doc.splitTextToSize(tc.tip, simColW - 7);
    let ty = currentY + 13.8;
    tipLines.forEach((tl: string) => {
      doc.text(tl, cx + 3.5, ty);
      ty += 3.1;
    });
  });

  currentY += simCardH + 6;

  // ==========================================
  // SECTION: TARGET UNIVERSITIES & PORTFOLIO STRATEGY
  // ==========================================
  onProgress?.('Mapping university portfolio and admissions odds...');
  drawSectionHeader(
    `Target Universities Portfolio (${profile.targetColleges.length} Institutions)`,
    'Application balance, admissions competitiveness categories, rounds, and milestones'
  );

  if (profile.targetColleges.length === 0) {
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.textDim);
    doc.text('No target universities added yet.', marginX, currentY + 3);
    currentY += 8;
  } else {
    // Portfolio Distribution Summary Bar in Caliber Dark Mode
    const reaches = profile.targetColleges.filter((c) => c.category === 'reach').length;
    const targets = profile.targetColleges.filter((c) => c.category === 'target').length;
    const safeties = profile.targetColleges.filter((c) => c.category === 'safety').length;

    let portfolioStatus = 'Well-Balanced Portfolio';
    let statusColor = colors.emerald;
    if (safeties === 0) {
      portfolioStatus = 'Missing Safety Schools (Action Required)';
      statusColor = colors.rose;
    } else if (reaches > targets + safeties) {
      portfolioStatus = 'Reach-Heavy Portfolio (Consider adding Targets/Safeties)';
      statusColor = colors.amber;
    } else if (safeties < targets) {
      portfolioStatus = 'Target-Heavy Portfolio (Recommend equalizing Safeties)';
      statusColor = colors.purpleAccent;
    }

    checkPageBreak(12);
    doc.setFillColor(...colors.bgCard);
    doc.roundedRect(marginX, currentY, contentWidth, 9, 1.5, 1.5, 'F');
    doc.setDrawColor(...colors.borderSubtle);
    doc.setLineWidth(0.25);
    doc.roundedRect(marginX, currentY, contentWidth, 9, 1.5, 1.5, 'S');
    drawGradientBar(marginX, currentY, contentWidth, 0.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.8);
    doc.setTextColor(...colors.textPrimary);
    doc.text(`Reach: ${reaches}   |   Target: ${targets}   |   Safety: ${safeties}`, marginX + 4, currentY + 6);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...statusColor);
    doc.text(portfolioStatus, pageWidth - marginX - 4, currentY + 6, { align: 'right' });
    currentY += 12;

    // Universities Table Header
    checkPageBreak(12);
    doc.setFillColor(...colors.bgCardHover);
    doc.rect(marginX, currentY, contentWidth, 6.5, 'F');
    drawGradientBar(marginX, currentY, contentWidth, 0.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.2);
    doc.setTextColor(...colors.textPrimary);
    doc.text('INSTITUTION', marginX + 3, currentY + 4.5);
    doc.text('CATEGORY', marginX + 80, currentY + 4.5);
    doc.text('ADMIT RATE', marginX + 110, currentY + 4.5);
    doc.text('DEADLINE / ROUND', marginX + 135, currentY + 4.5);
    doc.text('STATUS', marginX + 165, currentY + 4.5);
    currentY += 6.5;

    profile.targetColleges.forEach((col, idx) => {
      checkPageBreak(8);

      if (idx % 2 === 1) {
        doc.setFillColor(...colors.bgCardAlt);
        doc.rect(marginX, currentY, contentWidth, 7.5, 'F');
      } else {
        doc.setFillColor(...colors.bgCard);
        doc.rect(marginX, currentY, contentWidth, 7.5, 'F');
      }

      // College name & location
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(...colors.textPrimary);
      doc.text(col.name, marginX + 3, currentY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(6.5);
      doc.setTextColor(...colors.textMuted);
      doc.text(col.location || 'United States', marginX + 3, currentY + 6.8);

      // Category
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.2);
      if (col.category === 'reach') doc.setTextColor(...colors.rose);
      else if (col.category === 'target') doc.setTextColor(...colors.purpleAccent);
      else doc.setTextColor(...colors.emerald);
      doc.text(col.category.toUpperCase(), marginX + 80, currentY + 5);

      // Admit Rate
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...colors.textSecondary);
      doc.text(col.acceptanceRate || 'N/A', marginX + 110, currentY + 5);

      // Deadline & Round
      const deadlineStr = `${col.deadline || 'Jan 1'}${col.round ? ` (${col.round})` : ''}`;
      doc.text(deadlineStr, marginX + 135, currentY + 5);

      // Status
      const statusLabel = (col.status || 'in_progress').replace('_', ' ').toUpperCase();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(6.8);
      doc.setTextColor(...colors.textMuted);
      doc.text(statusLabel, marginX + 165, currentY + 5);

      doc.setDrawColor(...colors.borderSubtle);
      doc.setLineWidth(0.12);
      doc.line(marginX, currentY + 7.5, pageWidth - marginX, currentY + 7.5);

      currentY += 7.5;
    });
    currentY += 5;
  }

  // ==========================================
  // SECTION: STRATEGIC STRENGTHS & VULNERABILITIES
  // ==========================================
  onProgress?.('Structuring key strengths and tactical gaps in Caliber dark aesthetic...');
  drawSectionHeader('Strategic Advantages & Critical Gaps to Address');

  // Key Strengths
  if (analysis.keyStrengths && analysis.keyStrengths.length > 0) {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.emerald);
    doc.text('PRIMARY COMPETITIVE STRENGTHS', marginX, currentY + 4);
    currentY += 6;

    analysis.keyStrengths.forEach((st) => {
      const descLines = doc.splitTextToSize(st.description, contentWidth - 10);
      const cardHeight = 6 + descLines.length * 3.8;
      checkPageBreak(cardHeight + 2);

      // Card container in dark theme
      doc.setFillColor(...colors.bgCard);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(...colors.borderSubtle);
      doc.setLineWidth(0.2);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 1.5, 1.5, 'S');

      // Left accent bar (Emerald)
      doc.setFillColor(...colors.emerald);
      doc.rect(marginX, currentY, 2.5, cardHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(...colors.textPrimary);
      doc.text(st.title, marginX + 5, currentY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...colors.textSecondary);
      let sy = currentY + 7.8;
      descLines.forEach((l: string) => {
        doc.text(l, marginX + 5, sy);
        sy += 3.6;
      });

      currentY += cardHeight + 2.5;
    });
    currentY += 3;
  }

  // Gaps to Address
  if (analysis.gapsToAddress && analysis.gapsToAddress.length > 0) {
    checkPageBreak(12);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.amber);
    doc.text('VULNERABILITIES & MITIGATION STRATEGIES', marginX, currentY + 4);
    currentY += 6;

    analysis.gapsToAddress.forEach((gap) => {
      const sugLines = doc.splitTextToSize(gap.suggestion, contentWidth - 10);
      const cardHeight = 6 + sugLines.length * 3.8;
      checkPageBreak(cardHeight + 2);

      // Card container in dark theme
      doc.setFillColor(...colors.bgCard);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 1.5, 1.5, 'F');
      doc.setDrawColor(...colors.borderSubtle);
      doc.setLineWidth(0.2);
      doc.roundedRect(marginX, currentY, contentWidth, cardHeight, 1.5, 1.5, 'S');

      // Left accent bar (Amber)
      doc.setFillColor(...colors.amber);
      doc.rect(marginX, currentY, 2.5, cardHeight, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(...colors.textPrimary);
      doc.text(gap.title, marginX + 5, currentY + 4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.2);
      doc.setTextColor(...colors.textSecondary);
      let gy = currentY + 7.8;
      sugLines.forEach((l: string) => {
        doc.text(l, marginX + 5, gy);
        gy += 3.6;
      });

      currentY += cardHeight + 2.5;
    });
    currentY += 3;
  }

  // Priority Recommendation in Caliber Dark Mode
  if (analysis.priorityRecommendation) {
    checkPageBreak(22);
    doc.setFillColor(...colors.purpleDark);
    doc.roundedRect(marginX, currentY, contentWidth, 18, 2, 2, 'F');
    doc.setDrawColor(...colors.borderPurple);
    doc.setLineWidth(0.3);
    doc.roundedRect(marginX, currentY, contentWidth, 18, 2, 2, 'S');
    drawGradientBar(marginX, currentY, contentWidth, 0.8);
    drawGradientBar(marginX, currentY, 3, 18);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.textPurple);
    doc.text('PRIORITY STRATEGIC RECOMMENDATION', marginX + 6, currentY + 5.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(...colors.textPrimary);
    doc.text(analysis.priorityRecommendation.title, marginX + 6, currentY + 10);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(...colors.textSecondary);
    const recLines = doc.splitTextToSize(analysis.priorityRecommendation.description, contentWidth - 12);
    doc.text(recLines[0] || '', marginX + 6, currentY + 14.5);

    currentY += 23;
  }

  // ==========================================
  // SECTION: IMMEDIATE ACTIONABLE ROADMAP
  // ==========================================
  if (analysis.immediateNextSteps && analysis.immediateNextSteps.length > 0) {
    onProgress?.('Outlining actionable next steps in Caliber dark aesthetic...');
    drawSectionHeader('Actionable Admissions Roadmap & Next Steps');

    analysis.immediateNextSteps.forEach((step, idx) => {
      const stepLines = doc.splitTextToSize(step.text, contentWidth - 22);
      checkPageBreak(6 + stepLines.length * 4);

      // Checkbox square
      doc.setDrawColor(...colors.borderMid);
      doc.setLineWidth(0.25);
      if (step.completed) {
        doc.setFillColor(...colors.emeraldBg);
        doc.rect(marginX + 2, currentY + 1.5, 3.5, 3.5, 'F');
        doc.setDrawColor(...colors.emerald);
        doc.rect(marginX + 2, currentY + 1.5, 3.5, 3.5, 'S');
        doc.setTextColor(...colors.emerald);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.text('✓', marginX + 2.7, currentY + 4.2);
      } else {
        doc.setFillColor(...colors.bgCard);
        doc.rect(marginX + 2, currentY + 1.5, 3.5, 3.5, 'F');
        doc.rect(marginX + 2, currentY + 1.5, 3.5, 3.5, 'S');
      }

      // Step text
      doc.setFont('helvetica', step.completed ? 'normal' : 'bold');
      doc.setFontSize(7.8);
      doc.setTextColor(step.completed ? colors.textMuted[0] : colors.textPrimary[0], step.completed ? colors.textMuted[1] : colors.textPrimary[1], step.completed ? colors.textMuted[2] : colors.textPrimary[2]);
      let stepY = currentY + 4.2;
      stepLines.forEach((line: string) => {
        doc.text(line, marginX + 8, stepY);
        stepY += 3.8;
      });

      // Priority tag
      if (step.priority) {
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(...colors.purpleAccent);
        doc.text(`[${step.priority.toUpperCase()}]`, pageWidth - marginX - 16, currentY + 4.2);
      }

      currentY = stepY + 1;
    });
    currentY += 4;
  }

  // ==========================================
  // SECTION: CONTEXT NOTES / CIRCUMSTANCES (IF ANY)
  // ==========================================
  if (profile.contextNotes && profile.contextNotes.trim().length > 0) {
    drawSectionHeader('Strategic Narrative Context & Notes');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...colors.textSecondary);
    const noteLines = doc.splitTextToSize(profile.contextNotes, contentWidth);
    noteLines.forEach((nLine: string) => {
      checkPageBreak(5);
      doc.text(nLine, marginX, currentY);
      currentY += 4;
    });
    currentY += 4;
  }

  // ==========================================
  // FINAL PASS: RUNNING FOOTER & PAGE NUMBERS
  // ==========================================
  onProgress?.('Finalizing pages and formatting headers/footers in Caliber dark aesthetic...');
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    // If page > 1, draw running header
    if (i > 1) {
      drawGradientBar(0, 0, pageWidth, 1.4);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7.8);
      doc.setTextColor(...colors.textAccent);
      doc.text('CALIBER | CONFIDENTIAL ADMISSIONS DOSSIER', marginX, 10);
      doc.setTextColor(...colors.textMuted);
      doc.text(profile.name || 'Candidate Portfolio', pageWidth - marginX, 10, { align: 'right' });

      doc.setDrawColor(...colors.borderSubtle);
      doc.setLineWidth(0.25);
      doc.line(marginX, 12, pageWidth - marginX, 12);
    }

    // Running footer on all pages
    doc.setDrawColor(...colors.borderSubtle);
    doc.setLineWidth(0.25);
    doc.line(marginX, pageHeight - 11, pageWidth - marginX, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7);
    doc.setTextColor(...colors.textDim);
    doc.text(
      'CALIBER ADMISSIONS ADVISORY • PROPRIETARY & CONFIDENTIAL • PREPARED FOR STUDENT USE ONLY',
      marginX,
      pageHeight - 6.5
    );
    doc.setTextColor(...colors.textMuted);
    doc.text(`Page ${i} of ${totalPages}`, pageWidth - marginX, pageHeight - 6.5, { align: 'right' });
  }

  return doc;
}

/**
 * Compiles the PDF and returns a Blob and object URL for in-app preview
 */
export async function generateProfilePDFBlob(
  profile: UserProfile,
  analysis: AnalysisResult,
  options: { onProgress?: (status: string) => void } = {}
): Promise<{ blob: Blob; url: string; totalPages: number; doc: jsPDF }> {
  const doc = await generateProfilePDFDoc(profile, analysis, options);
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const totalPages = doc.getNumberOfPages();
  return { blob, url, totalPages, doc };
}

/**
 * Standard download function that compiles and saves the file directly
 */
export async function exportProfileToPDF(
  profile: UserProfile,
  analysis: AnalysisResult,
  options: ExportPDFOptions = {}
): Promise<void> {
  const { filename, onProgress } = options;
  const doc = await generateProfilePDFDoc(profile, analysis, { onProgress });
  onProgress?.('Downloading PDF file...');
  const safeName = (profile.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_');
  const targetFilename = filename || `Caliber_Admissions_Portfolio_${safeName}.pdf`;
  doc.save(targetFilename);
}
