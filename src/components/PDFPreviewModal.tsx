import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import * as pdfjsLib from 'pdfjs-dist';
import { UserProfile, AnalysisResult } from '../types';
import { generateProfilePDFDoc, generateProfilePDFBlob, exportProfileToPDF } from '../utils/exportProfilePDF';

// Configure PDF.js worker using local bundled worker with CDN fallback
if (typeof window !== 'undefined') {
  try {
    if (typeof Worker !== 'undefined') {
      const worker = new Worker(
        new URL('pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url),
        { type: 'module' }
      );
      pdfjsLib.GlobalWorkerOptions.workerPort = worker;
    } else {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    }
  } catch (e) {
    console.warn('Could not initialize local PDF worker, falling back to CDN:', e);
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  }
}

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
  analysis: AnalysisResult;
  onSuccessToast?: (msg: string) => void;
}

interface RenderedPage {
  pageNumber: number;
  dataUrl: string;
  width: number;
  height: number;
}

export const PDFPreviewModal: React.FC<PDFPreviewModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  analysis,
  onSuccessToast,
}) => {
  const [pages, setPages] = useState<RenderedPage[]>([]);
  const [totalPages, setTotalPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [isCompiling, setIsCompiling] = useState<boolean>(true);
  const [compileStatus, setCompileStatus] = useState<string>('Initializing PDF generator...');
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);
  const [showSectionNav, setShowSectionNav] = useState<boolean>(true);
  const [activeSectionId, setActiveSectionId] = useState<string>('overview');

  const pageContainerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const defaultFilename = `Caliber_Admissions_Portfolio_${(userProfile.name || 'Candidate').replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  const [filename] = useState<string>(defaultFilename);

  // Render PDF pages onto high-DPI HTML5 Canvases
  const renderPdfToCanvases = useCallback(async () => {
    setIsCompiling(true);
    setPages([]);
    setCompileStatus('Initializing PDF compilation...');

    try {
      // 1. Generate jsPDF instance
      setCompileStatus('Compiling vector report & radar geometry...');
      const doc = await generateProfilePDFDoc(userProfile, analysis, {
        onProgress: (status) => setCompileStatus(status),
      });

      setCompileStatus('Rasterizing high-DPI canvas pages...');
      const arrayBuffer = doc.output('arraybuffer');

      // 2. Load into PDF.js
      const loadingTask = pdfjsLib.getDocument({
        data: new Uint8Array(arrayBuffer),
        cMapUrl: 'https://unpkg.com/pdfjs-dist@' + pdfjsLib.version + '/cmaps/',
        cMapPacked: true,
      });

      const pdf = await loadingTask.promise;
      const count = pdf.numPages;
      setTotalPages(count);

      const renderedPages: RenderedPage[] = [];

      // Render each page at 2x resolution for crisp high-DPI canvas display
      for (let pageNum = 1; pageNum <= count; pageNum++) {
        setCompileStatus(`Rendering canvas page ${pageNum} of ${count}...`);
        const page = await pdf.getPage(pageNum);

        // High-DPI scale multiplier
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        const ctx = canvas.getContext('2d', { alpha: false });

        if (ctx) {
          // Fill deep obsidian dark background matching Caliber theme
          ctx.fillStyle = '#0b0f19';
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          await page.render({
            canvas,
            canvasContext: ctx,
            viewport,
          }).promise;

          renderedPages.push({
            pageNumber: pageNum,
            dataUrl: canvas.toDataURL('image/png', 0.95),
            width: viewport.width / 2,
            height: viewport.height / 2,
          });
        }
      }

      setPages(renderedPages);
      setIsCompiling(false);
    } catch (err) {
      console.error('Canvas PDF rendering error:', err);
      setCompileStatus('Rendering notice: Click download to receive the full vector PDF.');
      setIsCompiling(false);
    }
  }, [userProfile, analysis]);

  useEffect(() => {
    if (isOpen) {
      setCurrentPage(1);
      setZoomLevel(100);
      renderPdfToCanvases();
    } else {
      setPages([]);
    }
  }, [isOpen, renderPdfToCanvases]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Scroll to a specific page
  const scrollToPage = (pageNum: number) => {
    setCurrentPage(pageNum);
    const targetEl = pageContainerRefs.current[pageNum - 1];
    if (targetEl) {
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return;
    setIsDownloading(true);

    try {
      await exportProfileToPDF(userProfile, analysis, {
        filename: filename.endsWith('.pdf') ? filename : `${filename}.pdf`,
      });
      if (onSuccessToast) {
        onSuccessToast(`✓ Downloaded ${filename}!`);
      }
      setTimeout(() => {
        setIsDownloading(false);
      }, 800);
    } catch (err) {
      console.error('Download failed:', err);
      setIsDownloading(false);
    }
  };

  const handleOpenNewTab = async () => {
    try {
      const { url } = await generateProfilePDFBlob(userProfile, analysis);
      window.open(url, '_blank');
    } catch (err) {
      console.error('Failed to open PDF in new tab:', err);
    }
  };

  const dossierSections = [
    {
      id: 'overview',
      title: 'Executive Dossier & Composite',
      desc: 'Candidate identity, composite score & target major',
      page: 1,
      icon: 'badge',
      color: 'text-indigo-400',
    },
    {
      id: 'geometry',
      title: 'Applicant Narrative Geometry',
      desc: '6-Axis vector spike radar vs Top 20 benchmark',
      page: 1,
      icon: 'radar',
      color: 'text-purple-400',
    },
    {
      id: 'scorecard',
      title: 'Pillar Competitiveness Scorecard',
      desc: 'Academics, ECs, Spike, Testing & Writing gaps',
      page: 1,
      icon: 'assessment',
      color: 'text-indigo-300',
    },
    {
      id: 'academics',
      title: 'Academic Record & Rigor Breakdown',
      desc: 'GPA, Rigor Multiplier, Testing & AP coursework',
      page: 2,
      icon: 'school',
      color: 'text-emerald-400',
    },
    {
      id: 'activities',
      title: 'Extracurricular Tiers & Honors',
      desc: `${userProfile.activities?.length || 0} activities, ${userProfile.awards?.length || 0} honors with impact ratings`,
      page: 2,
      icon: 'military_tech',
      color: 'text-amber-400',
    },
    {
      id: 'simulator',
      title: 'Admissions Odds Simulator',
      desc: 'Selectivity distribution & Reach / Target / Safety odds',
      page: 3,
      icon: 'insights',
      color: 'text-rose-400',
    },
    {
      id: 'colleges',
      title: 'Target Universities Portfolio',
      desc: `${userProfile.targetColleges?.length || 0} target institutions with deadlines & status`,
      page: 3,
      icon: 'account_balance',
      color: 'text-blue-400',
    },
    {
      id: 'roadmap',
      title: 'Actionable Strategic Roadmap',
      desc: 'Priority recommendations & execution milestones',
      page: 3,
      icon: 'checklist',
      color: 'text-emerald-300',
    },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 bg-black/85 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 10 }}
          transition={{ duration: 0.22, ease: 'easeOut' }}
          className="relative w-full max-w-7xl h-[92vh] max-h-[1050px] bg-[#0b0f19] border border-white/15 rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100"
        >
          {/* Top Brand Ambient Accent Bar */}
          <div className="h-1 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 shrink-0" />

          {/* Modal Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6 sm:py-3.5 border-b border-white/10 bg-[#101626] shrink-0">
            {/* Title & Document Info */}
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/40 flex items-center justify-center text-indigo-300 shrink-0">
                <span className="material-symbols-outlined text-[22px]">preview</span>
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[16px] sm:text-[17px] font-bold text-white tracking-tight">
                    Admissions Dossier • Document Preview
                  </h3>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    Caliber Dark Aesthetic
                  </span>
                  {totalPages > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-white/[0.06] text-slate-300 border border-white/10">
                      {totalPages} Pages High-DPI Canvas
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-slate-400">
                  Interactive in-app review for <strong className="text-white">{userProfile.name || 'Candidate'}</strong> ({userProfile.intendedMajor || 'Undecided'})
                </p>
              </div>
            </div>

            {/* Header Controls & Actions */}
            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap">
              {/* Page Selector Pills */}
              {totalPages > 1 && !isCompiling && (
                <div className="flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-0.5">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((pNum) => (
                    <button
                      key={pNum}
                      type="button"
                      onClick={() => scrollToPage(pNum)}
                      className={`px-2.5 py-1 rounded-lg text-[11.5px] font-bold cursor-pointer transition-colors ${
                        currentPage === pNum
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      P.{pNum}
                    </button>
                  ))}
                </div>
              )}

              {/* Zoom Controls */}
              <div className="hidden md:flex items-center bg-white/[0.04] border border-white/10 rounded-xl p-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 15, 60))}
                  className="px-2 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-[12px] font-semibold cursor-pointer"
                  title="Zoom Out"
                >
                  <span className="material-symbols-outlined text-[16px]">remove</span>
                </button>
                <span className="px-2 text-[11.5px] font-mono text-indigo-300 min-w-[48px] text-center">
                  {zoomLevel}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 15, 160))}
                  className="px-2 py-1 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg text-[12px] font-semibold cursor-pointer"
                  title="Zoom In"
                >
                  <span className="material-symbols-outlined text-[16px]">add</span>
                </button>
                <div className="h-3.5 w-[1px] bg-white/15 mx-1" />
                <button
                  type="button"
                  onClick={() => setZoomLevel(100)}
                  className="px-2.5 py-1 text-[11.5px] text-slate-300 hover:text-white hover:bg-white/10 rounded-lg font-medium cursor-pointer"
                >
                  Fit
                </button>
              </div>

              {/* Toggle Sidebar */}
              <button
                type="button"
                onClick={() => setShowSectionNav((v) => !v)}
                className={`hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-[12px] font-medium transition-colors cursor-pointer ${
                  showSectionNav
                    ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-200'
                    : 'bg-white/[0.04] border-white/10 text-slate-300 hover:text-white'
                }`}
                title="Toggle Sections Guide"
              >
                <span className="material-symbols-outlined text-[16px]">toc</span>
                <span>Sections</span>
              </button>

              {/* Open in New Tab Button */}
              <button
                type="button"
                onClick={handleOpenNewTab}
                className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-white/10 bg-white/[0.04] text-slate-300 hover:text-white hover:bg-white/[0.08] text-[12px] font-medium transition-colors cursor-pointer"
                title="Open PDF in a new browser tab"
              >
                <span className="material-symbols-outlined text-[16px]">open_in_new</span>
                <span>New Tab</span>
              </button>

              {/* Download PDF Button */}
              <button
                type="button"
                onClick={handleDownload}
                disabled={isCompiling || isDownloading}
                className="px-4 py-1.5 rounded-xl glass-btn-primary text-[12.5px] font-bold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-500/25 disabled:opacity-50"
              >
                <span className={`material-symbols-outlined text-[16px] ${isDownloading ? 'animate-spin' : ''}`}>
                  {isDownloading ? 'progress_activity' : 'download'}
                </span>
                <span>{isDownloading ? 'Downloading...' : 'Download PDF'}</span>
              </button>

              {/* Close Modal */}
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer ml-1"
                title="Close preview (Esc)"
              >
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>
          </div>

          {/* Main Body: Sections Guide + Scaled Canvas Viewport */}
          <div className="flex-1 flex overflow-hidden relative">
            {/* Sections Guide Sidebar */}
            {showSectionNav && (
              <div className="w-72 hidden lg:flex flex-col border-r border-white/10 bg-[#0e1422] shrink-0 p-3.5 overflow-y-auto">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-white/10">
                  <span className="text-[11px] font-bold text-indigo-300 uppercase tracking-wider">
                    Dossier Sections
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {dossierSections.length} components
                  </span>
                </div>

                <div className="space-y-1.5">
                  {dossierSections.map((sec) => (
                    <div
                      key={sec.id}
                      onClick={() => {
                        setActiveSectionId(sec.id);
                        scrollToPage(sec.page);
                      }}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer ${
                        activeSectionId === sec.id
                          ? 'bg-indigo-500/15 border-indigo-500/50 shadow-sm'
                          : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.05] hover:border-white/15'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className={`material-symbols-outlined text-[15px] ${sec.color}`}>
                            {sec.icon}
                          </span>
                          <span className="text-[12px] font-bold text-white leading-snug">
                            {sec.title}
                          </span>
                        </div>
                        <span className="px-1.5 py-0.2 rounded text-[9.5px] font-semibold bg-white/[0.08] text-slate-300">
                          P.{sec.page}
                        </span>
                      </div>
                      <p className="text-[10.5px] text-slate-400 line-clamp-2 pl-5">
                        {sec.desc}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Section Quick Summary Note */}
                <div className="mt-auto pt-3 border-t border-white/10">
                  <div className="p-2.5 rounded-xl bg-indigo-950/30 border border-indigo-500/20 text-[11px] text-slate-300 flex items-start gap-2">
                    <span className="material-symbols-outlined text-[16px] text-indigo-400 shrink-0 mt-0.5">
                      verified
                    </span>
                    <p className="leading-tight">
                      Rendered using High-DPI canvas rasterization. Crisp text, vector radar spikes, and accurate margins guaranteed.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Central Canvas Viewport Area (Scrollable Document Feed) */}
            <div
              ref={scrollContainerRef}
              className="flex-1 flex flex-col items-center p-4 sm:p-8 bg-[#060810] overflow-y-auto relative scroll-smooth"
            >
              {/* Compiling / Loading State */}
              {isCompiling ? (
                <div className="my-auto flex flex-col items-center justify-center gap-4 text-center max-w-md p-8 rounded-2xl bg-[#111728] border border-white/10 shadow-2xl">
                  <div className="relative w-16 h-16 flex items-center justify-center">
                    <div className="absolute inset-0 rounded-full border-2 border-indigo-500/20 animate-ping" />
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                      <span className="material-symbols-outlined text-[26px] text-white animate-spin">
                        progress_activity
                      </span>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-[15px] font-bold text-white mb-1">
                      Generating High-DPI Canvas Preview
                    </h4>
                    <p className="text-[12px] text-indigo-300 font-mono">
                      {compileStatus || 'Drawing vector geometry & selectivity curves...'}
                    </p>
                  </div>

                  {/* Progress Indicator Bar */}
                  <div className="w-full bg-white/10 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 h-full w-3/4 animate-pulse rounded-full" />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Applying obsidian dark mode styling, charts &amp; tables directly to canvas
                  </span>
                </div>
              ) : pages.length > 0 ? (
                /* Document Pages Feed */
                <div
                  className="flex flex-col items-center gap-8 transition-transform duration-200"
                  style={{
                    transform: zoomLevel !== 100 ? `scale(${zoomLevel / 100})` : undefined,
                    transformOrigin: 'top center',
                  }}
                >
                  {pages.map((p, idx) => (
                    <div
                      key={p.pageNumber}
                      ref={(el) => {
                        pageContainerRefs.current[idx] = el;
                      }}
                      className="relative flex flex-col items-center group"
                    >
                      {/* Page Label & Number Header Pill */}
                      <div className="flex items-center justify-between w-full max-w-[760px] mb-2 px-2 text-[11px] text-slate-400">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-white/[0.06] text-indigo-300 font-bold uppercase tracking-wider text-[9.5px] border border-white/10">
                            Page {p.pageNumber} of {totalPages}
                          </span>
                          <span className="text-slate-400 font-medium">
                            {p.pageNumber === 1
                              ? 'Executive Summary & Narrative Spike Geometry'
                              : p.pageNumber === 2
                              ? 'Academic Record & Extracurricular Matrix'
                              : 'Admissions Odds Simulator & Target Universities'}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400">
                          A4 • {Math.round(p.width)} × {Math.round(p.height)} pt
                        </span>
                      </div>

                      {/* Rendered Canvas Image Sheet */}
                      <div className="relative rounded-lg overflow-hidden border border-white/15 shadow-[0_12px_40px_rgba(0,0,0,0.7)] bg-[#0b0f19]">
                        <img
                          src={p.dataUrl}
                          alt={`Admissions Dossier Page ${p.pageNumber}`}
                          className="w-[760px] max-w-full h-auto block select-none"
                          style={{
                            aspectRatio: `${p.width} / ${p.height}`,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Fallback */
                <div className="my-auto flex flex-col items-center justify-center gap-3 text-center p-8 bg-[#111728] rounded-xl border border-white/10">
                  <span className="material-symbols-outlined text-[32px] text-rose-400">
                    error_outline
                  </span>
                  <p className="text-[13px] text-slate-300">
                    Unable to generate canvas preview for this profile.
                  </p>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-2 glass-btn-primary rounded-xl text-[12px] font-semibold cursor-pointer"
                  >
                    Download Dossier Directly
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Modal Footer Controls */}
          <div className="px-4 py-2.5 sm:px-6 border-t border-white/10 bg-[#101626] flex flex-wrap items-center justify-between gap-3 text-[12px] shrink-0">
            {/* Document Filename Info */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[16px] text-indigo-400">
                description
              </span>
              <span className="text-slate-400 text-[11.5px] hidden sm:inline">Filename:</span>
              <span className="font-mono text-[11.5px] text-slate-200 bg-white/[0.04] px-2 py-0.5 rounded border border-white/10">
                {filename}
              </span>
            </div>

            {/* Bottom Actions */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-1.5 rounded-xl glass-btn-secondary text-slate-300 hover:text-white cursor-pointer font-semibold text-[12px]"
              >
                Close Preview
              </button>
              <button
                type="button"
                onClick={handleDownload}
                disabled={isCompiling || isDownloading}
                className="px-4 py-1.5 rounded-xl glass-btn-primary font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-md shadow-indigo-500/20 disabled:opacity-50 text-[12px]"
              >
                <span className={`material-symbols-outlined text-[15px] ${isDownloading ? 'animate-spin' : ''}`}>
                  {isDownloading ? 'progress_activity' : 'download'}
                </span>
                <span>Download Report</span>
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
