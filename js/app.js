/**
 * CareerLens AI - Application Controller
 * Handles UI interactions, robust PDF parsing, drag-and-drop, animations,
 * baseline transparent scoring, filtering, interview questions, and bullet optimizer.
 */

(function () {
  "use strict";

  // Configure PDF.js worker if available
  if (typeof pdfjsLib !== "undefined") {
    pdfjsLib.GlobalWorkerOptions.workerSrc =
      "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
  }

  class CareerLensApp {
    constructor() {
      this.analyzer = new CareerLensAnalyzer();
      this.currentMode = "upload"; // 'upload' or 'paste'
      this.currentAnalysis = null;
      this.activeSkillCategory = "all";
      this.activeQuestionCategory = "all";
      this.interviewSearchTerm = "";
      this.candidateNotes = {};
      this.scannerTimer = null;
      this.allAnswersExpanded = false;

      // AI Integration State
      this.currentEngineMode = "ai"; // 'ai' or 'baseline'
      this.serverAiAvailable = false;
      this.aiProviderName = "none";
      this.aiModelName = "";
      this.activeAbortController = null;
      this.lastSubmittedResume = "";
      this.lastSubmittedJob = "";

      this.initDomElements();
      this.initTheme();
      this.bindEvents();
      this.loadSavedNotes();

      // Show initial empty state
      this.showEmptyState();
      this.updateCounters();
      this.checkServerAiStatus();
    }

    initDomElements() {
      // AI Engine Controls & Status
      this.engineStatusBadge = document.getElementById("engineStatusBadge");
      this.engineStatusText = document.getElementById("engineStatusText");
      this.modeAiBtn = document.getElementById("modeAiBtn");
      this.modeBaselineBtn = document.getElementById("modeBaselineBtn");
      this.aiStatusHint = document.getElementById("aiStatusHint");
      this.analyzeBtnLabel = document.getElementById("analyzeBtnLabel");

      // Inputs & Panels
      this.resumePanel = document.getElementById("resumePanel");
      this.jobPanel = document.getElementById("jobPanel");
      this.tabUpload = document.getElementById("tabUpload");
      this.tabPaste = document.getElementById("tabPaste");
      this.dropzoneView = document.getElementById("dropzoneView");
      this.pasteView = document.getElementById("pasteView");
      this.dropzone = document.getElementById("dropzone");
      this.fileInput = document.getElementById("fileInput");
      this.browseFileBtn = document.getElementById("browseFileBtn");
      this.fileChipPreview = document.getElementById("fileChipPreview");
      this.fileNameLabel = document.getElementById("fileNameLabel");
      this.fileSizeLabel = document.getElementById("fileSizeLabel");
      this.removeFileBtn = document.getElementById("removeFileBtn");

      this.resumeTextInput = document.getElementById("resumeTextInput");
      this.jobTextInput = document.getElementById("jobTextInput");
      this.resumeErrorAlert = document.getElementById("resumeErrorAlert");
      this.jobErrorAlert = document.getElementById("jobErrorAlert");

      this.resumeWordCount = document.getElementById("resumeWordCount");
      this.resumeCharCount = document.getElementById("resumeCharCount");
      this.jobWordCount = document.getElementById("jobWordCount");
      this.jobCharCount = document.getElementById("jobCharCount");
      this.resumeStatusNote = document.getElementById("resumeStatusNote");
      this.jobStatusNote = document.getElementById("jobStatusNote");

      // Actions
      this.analyzeMatchBtn = document.getElementById("analyzeMatchBtn");
      this.demoMatchBtn = document.getElementById("demoMatchBtn");
      this.quickDemoHeroBtn = document.getElementById("quickDemoHeroBtn");
      this.clearAllInputsBtn = document.getElementById("clearAllInputsBtn");
      this.clearJobDescBtn = document.getElementById("clearJobDescBtn");

      // Empty State
      this.emptyStateSection = document.getElementById("emptyStateSection");
      this.emptyStateDemoBtn = document.getElementById("emptyStateDemoBtn");
      this.emptyStateAiBtn = document.getElementById("emptyStateAiBtn");

      // Scanner Modal Elements
      this.scannerOverlay = document.getElementById("scannerOverlay");
      this.scannerEngineTag = document.getElementById("scannerEngineTag");
      this.scannerEngineBadge = document.getElementById("scannerEngineBadge");
      this.scannerActiveContent = document.getElementById("scannerActiveContent");
      this.scannerRadarIcon = document.getElementById("scannerRadarIcon");
      this.scannerStageText = document.getElementById("scannerStageText");
      this.scannerProgressFill = document.getElementById("scannerProgressFill");
      this.cancelScanBtn = document.getElementById("cancelScanBtn");

      // Scanner Error & Retry Elements
      this.scannerErrorBox = document.getElementById("scannerErrorBox");
      this.scannerErrorTitle = document.getElementById("scannerErrorTitle");
      this.scannerErrorMsg = document.getElementById("scannerErrorMsg");
      this.retryAiBtn = document.getElementById("retryAiBtn");
      this.fallbackBaselineBtn = document.getElementById("fallbackBaselineBtn");
      this.dismissScannerErrorBtn = document.getElementById("dismissScannerErrorBtn");

      this.steps = [
        document.getElementById("step1"),
        document.getElementById("step2"),
        document.getElementById("step3"),
        document.getElementById("step4"),
        document.getElementById("step5")
      ];

      // Inputs Modified Banner
      this.inputsModifiedBanner = document.getElementById("inputsModifiedBanner");
      this.reanalyzeQuickBtn = document.getElementById("reanalyzeQuickBtn");

      // Results Elements
      this.resultsSection = document.getElementById("resultsSection");
      this.resultsEngineTag = document.getElementById("resultsEngineTag");
      this.resultsEngineBadge = document.getElementById("resultsEngineBadge");
      this.candidateAvatar = document.getElementById("candidateAvatar");
      this.candidateNameDisplay = document.getElementById("candidateNameDisplay");
      this.targetRoleDisplay = document.getElementById("targetRoleDisplay");
      this.analysisTimestamp = document.getElementById("analysisTimestamp");
      this.exportPdfBtn = document.getElementById("exportPdfBtn");
      this.downloadMdBtn = document.getElementById("downloadMdBtn");
      this.downloadJsonBtn = document.getElementById("downloadJsonBtn");
      this.shareAnalysisBtn = document.getElementById("shareAnalysisBtn");
      this.resetWorkspaceBtn = document.getElementById("resetWorkspaceBtn");
      this.reanalyzeBtn = document.getElementById("reanalyzeBtn");

      // Score overview & Dual Score indicators
      this.mainScoreTypeBadge = document.getElementById("mainScoreTypeBadge");
      this.deterministicBadgeSummary = document.getElementById("deterministicBadgeSummary");
      this.deterministicScorePercent = document.getElementById("deterministicScorePercent");
      this.dualScoreContainer = document.getElementById("dualScoreContainer");
      this.dualScoreAiBox = document.getElementById("dualScoreAiBox");
      this.dualScoreKeywordBox = document.getElementById("dualScoreKeywordBox");
      this.aiSemanticScoreVal = document.getElementById("aiSemanticScoreVal");
      this.aiSemanticScoreSub = document.getElementById("aiSemanticScoreSub");
      this.deterministicScoreVal = document.getElementById("deterministicScoreVal");
      this.deterministicScoreCaption = document.getElementById("deterministicScoreCaption");

      this.gaugeProgressCircle = document.getElementById("gaugeProgressCircle");
      this.overallScoreDisplay = document.getElementById("overallScoreDisplay");
      this.ratingBadge = document.getElementById("ratingBadge");
      this.scoreVerdictNote = document.getElementById("scoreVerdictNote");

      // Transparent Formula Breakdown Elements
      this.toggleFormulaBtn = document.getElementById("toggleFormulaBtn");
      this.formulaBody = document.getElementById("formulaBody");
      this.formulaArrow = document.getElementById("formulaArrow");
      this.formulaSkillsText = document.getElementById("formulaSkillsText");
      this.formulaAtsText = document.getElementById("formulaAtsText");
      this.formulaExpText = document.getElementById("formulaExpText");
      this.formulaKeyText = document.getElementById("formulaKeyText");

      this.skillMatchVal = document.getElementById("skillMatchVal");
      this.skillMatchBar = document.getElementById("skillMatchBar");
      this.atsScoreVal = document.getElementById("atsScoreVal");
      this.atsScoreBar = document.getElementById("atsScoreBar");
      this.experienceVal = document.getElementById("experienceVal");
      this.experienceBar = document.getElementById("experienceBar");
      this.keywordVal = document.getElementById("keywordVal");
      this.keywordBar = document.getElementById("keywordBar");

      // Domain Category Breakdown (Accessible Progress Bars)
      this.categoryBreakdownCard = document.getElementById("categoryBreakdownCard");
      this.categoryBarsGrid = document.getElementById("categoryBarsGrid");

      this.matchedCount = document.getElementById("matchedCount");
      this.missingCount = document.getElementById("missingCount");
      this.matchedSkillsTags = document.getElementById("matchedSkillsTags");
      this.missingSkillsTags = document.getElementById("missingSkillsTags");
      this.keywordBarsContainer = document.getElementById("keywordBarsContainer");

      this.strengthsList = document.getElementById("strengthsList");
      this.weaknessesList = document.getElementById("weaknessesList");
      this.recsList = document.getElementById("recsList");
      this.copyRecommendationsBtn = document.getElementById("copyRecommendationsBtn");

      // Personalized Skill-Gap Learning Roadmap
      this.learningRoadmapSection = document.getElementById("learningRoadmapSection");
      this.roadmapEngineBadge = document.getElementById("roadmapEngineBadge");
      this.copyRoadmapBtn = document.getElementById("copyRoadmapBtn");
      this.roadmapProgressTracker = document.getElementById("roadmapProgressTracker");
      this.roadmapCompletedCount = document.getElementById("roadmapCompletedCount");
      this.roadmapTotalCount = document.getElementById("roadmapTotalCount");
      this.roadmapPercentText = document.getElementById("roadmapPercentText");
      this.roadmapProgressBar = document.getElementById("roadmapProgressBar");
      this.roadmapPhasesGrid = document.getElementById("roadmapPhasesGrid");

      // Interview section controls
      this.interviewQuestionsContainer = document.getElementById("interviewQuestionsContainer");
      this.copyAllQuestionsBtn = document.getElementById("copyAllQuestionsBtn");
      this.interviewSearchInput = document.getElementById("interviewSearchInput");
      this.toggleAllAnswersBtn = document.getElementById("toggleAllAnswersBtn");
      this.clearNotesBtn = document.getElementById("clearNotesBtn");

      // Bullet Optimizer
      this.bulletInputText = document.getElementById("bulletInputText");
      this.optimizeBulletBtn = document.getElementById("optimizeBulletBtn");
      this.optimizerResults = document.getElementById("optimizerResults");

      // Theme toggle
      this.themeToggleBtn = document.getElementById("themeToggleBtn");
      this.themeIconDark = document.getElementById("themeIconDark");
      this.themeIconLight = document.getElementById("themeIconLight");
      this.toastContainer = document.getElementById("toastContainer");
    }

    /* ==========================================================================
       Theme Management (Dark / Light)
       ========================================================================== */
    initTheme() {
      const savedTheme = localStorage.getItem("careerlens_theme") || "dark";
      this.setTheme(savedTheme);
    }

    setTheme(theme) {
      document.documentElement.setAttribute("data-theme", theme);
      localStorage.setItem("careerlens_theme", theme);
      if (theme === "dark") {
        this.themeIconDark.style.display = "block";
        this.themeIconLight.style.display = "none";
      } else {
        this.themeIconDark.style.display = "none";
        this.themeIconLight.style.display = "block";
      }
    }

    toggleTheme() {
      const current = document.documentElement.getAttribute("data-theme") || "dark";
      const next = current === "dark" ? "light" : "dark";
      this.setTheme(next);
      this.showToast(`Switched to ${next} theme`, "info", 1800);
    }

    /* ==========================================================================
       Event Binding
       ========================================================================== */
    bindEvents() {
      // Theme toggle
      this.themeToggleBtn.addEventListener("click", () => this.toggleTheme());

      // Mode Switch: Upload vs Paste
      this.tabUpload.addEventListener("click", () => this.switchMode("upload"));
      this.tabPaste.addEventListener("click", () => this.switchMode("paste"));

      // Dropzone & File Browse
      this.browseFileBtn.addEventListener("click", () => this.fileInput.click());
      this.fileInput.addEventListener("change", (e) => this.handleFileSelection(e.target.files[0]));
      
      this.dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        this.dropzone.classList.add("dragover");
      });
      this.dropzone.addEventListener("dragleave", () => {
        this.dropzone.classList.remove("dragover");
      });
      this.dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        this.dropzone.classList.remove("dragover");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
          this.handleFileSelection(e.dataTransfer.files[0]);
        }
      });

      this.removeFileBtn.addEventListener("click", () => this.clearUploadedFile());

      // Live Counters & Input validation reset + modification check
      this.resumeTextInput.addEventListener("input", () => {
        this.clearInputErrors();
        this.updateCounters();
        this.checkInputsModified();
      });
      this.jobTextInput.addEventListener("input", () => {
        this.clearInputErrors();
        this.updateCounters();
        this.checkInputsModified();
      });

      // Sample Profiles
      document.querySelectorAll(".preset-chip[data-profile]").forEach(btn => {
        btn.addEventListener("click", (e) => {
          const profileId = e.currentTarget.getAttribute("data-profile");
          this.loadSampleProfile(profileId);
        });
      });

      // Smooth navigation handlers
      document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
          const targetId = anchor.getAttribute('href');
          if (targetId === '#interview-section' || targetId === '#optimizer-section') {
            if (!this.resultsSection.classList.contains('active')) {
              e.preventDefault();
              this.loadSampleProfile('fullstack');
              this.completeAnalysis(this.resumeTextInput.value, this.jobTextInput.value);
              setTimeout(() => {
                const target = document.querySelector(targetId);
                if (target) target.scrollIntoView({ behavior: 'smooth' });
              }, 150);
            }
          }
        });
      });

      // Clear buttons & Reset controls
      this.clearAllInputsBtn.addEventListener("click", () => this.resetWorkspace());
      if (this.resetWorkspaceBtn) {
        this.resetWorkspaceBtn.addEventListener("click", () => this.resetWorkspace());
      }

      this.clearJobDescBtn.addEventListener("click", () => {
        this.jobTextInput.value = "";
        this.clearInputErrors();
        this.updateCounters();
        this.showToast("Job description cleared", "info", 1500);
      });

      // Main CTA
      this.analyzeMatchBtn.addEventListener("click", () => this.triggerAnalysis());
      if (this.reanalyzeBtn) {
        this.reanalyzeBtn.addEventListener("click", () => this.triggerAnalysis());
      }

      this.demoMatchBtn.addEventListener("click", () => {
        this.loadSampleProfile("fullstack");
        this.triggerAnalysis();
      });

      if (this.quickDemoHeroBtn) {
        this.quickDemoHeroBtn.addEventListener("click", () => {
          this.loadSampleProfile("fullstack");
          document.getElementById("analyzer").scrollIntoView({ behavior: "smooth" });
          this.showToast("Loaded Senior Full-Stack Engineer profile", "info");
        });
      }

      // Empty State Demo Buttons
      if (this.emptyStateDemoBtn) {
        this.emptyStateDemoBtn.addEventListener("click", () => {
          this.loadSampleProfile("fullstack");
          this.triggerAnalysis();
        });
      }
      if (this.emptyStateAiBtn) {
        this.emptyStateAiBtn.addEventListener("click", () => {
          this.loadSampleProfile("aiEngineer");
          this.triggerAnalysis();
        });
      }

      // Scanner Cancel Button
      if (this.cancelScanBtn) {
        this.cancelScanBtn.addEventListener("click", () => this.cancelAnalysis());
      }

      // Formula Toggle
      if (this.toggleFormulaBtn) {
        this.toggleFormulaBtn.addEventListener("click", () => this.toggleFormulaDetails());
      }

      // Keyboard Shortcut: Ctrl+Enter / Cmd+Enter runs analysis
      window.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          this.triggerAnalysis();
        }
      });

      // Skill Category Filters
      const skillFilters = document.getElementById("skillCategoryFilters");
      if (skillFilters) {
        skillFilters.addEventListener("click", (e) => {
          if (e.target.classList.contains("filter-pill")) {
            skillFilters.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
            e.target.classList.add("active");
            this.activeSkillCategory = e.target.getAttribute("data-category");
            this.renderFilteredSkills();
          }
        });
      }

      // Interview Category Filters
      const interviewTabs = document.getElementById("interviewFilterTabs");
      if (interviewTabs) {
        interviewTabs.addEventListener("click", (e) => {
          if (e.target.classList.contains("filter-pill")) {
            interviewTabs.querySelectorAll(".filter-pill").forEach(p => p.classList.remove("active"));
            e.target.classList.add("active");
            this.activeQuestionCategory = e.target.getAttribute("data-qcat");
            this.renderFilteredQuestions();
          }
        });
      }

      // Interview Search Input
      if (this.interviewSearchInput) {
        this.interviewSearchInput.addEventListener("input", (e) => {
          this.interviewSearchTerm = e.target.value.toLowerCase().trim();
          this.renderFilteredQuestions();
        });
      }

      // Toggle All Answers Button
      if (this.toggleAllAnswersBtn) {
        this.toggleAllAnswersBtn.addEventListener("click", () => this.toggleAllAnswers());
      }

      // Clear Notes Button
      if (this.clearNotesBtn) {
        this.clearNotesBtn.addEventListener("click", () => this.clearAllPracticeNotes());
      }

      // Copy All Questions
      this.copyAllQuestionsBtn.addEventListener("click", () => this.copyAllQuestions());

      // Bullet Optimizer
      this.optimizeBulletBtn.addEventListener("click", () => this.runBulletOptimizer());
      document.querySelectorAll(".bullet-sample-chip").forEach(chip => {
        chip.addEventListener("click", (e) => {
          const sample = e.currentTarget.getAttribute("data-sample");
          this.bulletInputText.value = sample;
          this.runBulletOptimizer();
        });
      });

      // Export PDF, Markdown, JSON & Share
      this.exportPdfBtn.addEventListener("click", () => {
        this.showToast("Preparing document for print / PDF export...", "info", 2000);
        setTimeout(() => window.print(), 300);
      });

      if (this.downloadMdBtn) {
        this.downloadMdBtn.addEventListener("click", () => this.downloadMarkdownReport());
      }
      if (this.downloadJsonBtn) {
        this.downloadJsonBtn.addEventListener("click", () => this.downloadJsonReport());
      }
      if (this.copyRecommendationsBtn) {
        this.copyRecommendationsBtn.addEventListener("click", () => this.copyRecommendations());
      }
      if (this.copyRoadmapBtn) {
        this.copyRoadmapBtn.addEventListener("click", () => this.copyLearningRoadmap());
      }
      if (this.reanalyzeQuickBtn) {
        this.reanalyzeQuickBtn.addEventListener("click", () => this.triggerAnalysis());
      }

      this.shareAnalysisBtn.addEventListener("click", () => this.copySummary());

      // Engine Mode Selector (AI vs Baseline)
      if (this.modeAiBtn) {
        this.modeAiBtn.addEventListener("click", () => this.setEngineMode("ai"));
      }
      if (this.modeBaselineBtn) {
        this.modeBaselineBtn.addEventListener("click", () => this.setEngineMode("baseline"));
      }

      // Scanner Error Recovery Buttons
      if (this.retryAiBtn) {
        this.retryAiBtn.addEventListener("click", () => this.retryAiAnalysis());
      }
      if (this.fallbackBaselineBtn) {
        this.fallbackBaselineBtn.addEventListener("click", () => this.runBaselineFallback());
      }
      if (this.dismissScannerErrorBtn) {
        this.dismissScannerErrorBtn.addEventListener("click", () => this.dismissScannerError());
      }
    }

    /* ==========================================================================
       Mode Switching: Upload vs Paste
       ========================================================================== */
    switchMode(mode) {
      this.currentMode = mode;
      if (mode === "upload") {
        this.tabUpload.classList.add("active");
        this.tabPaste.classList.remove("active");
        this.dropzoneView.style.display = "block";
        this.pasteView.style.display = "none";
      } else {
        this.tabPaste.classList.add("active");
        this.tabUpload.classList.remove("active");
        this.dropzoneView.style.display = "none";
        this.pasteView.style.display = "flex";
        this.resumeTextInput.focus();
      }
    }

    /* ==========================================================================
       File Selection & Robust PDF Text Extraction
       ========================================================================== */
    async handleFileSelection(file) {
      if (!file) return;

      // File Size Check (15MB Limit)
      if (file.size > 15 * 1024 * 1024) {
        this.showToast("File exceeds 15MB limit. Please upload a smaller file or paste text directly.", "error", 4000);
        this.clearUploadedFile();
        return;
      }

      const fileName = file.name;
      const fileSize = (file.size / 1024).toFixed(1) + " KB";

      this.fileNameLabel.textContent = fileName;
      this.fileSizeLabel.textContent = `${fileSize} • Extracting text...`;
      this.fileChipPreview.style.display = "flex";
      this.dropzone.style.display = "none";
      this.clearInputErrors();

      try {
        if (file.type === "application/pdf" || fileName.toLowerCase().endsWith(".pdf")) {
          this.showToast("Extracting text from PDF pages in browser...", "info", 2500);
          const extractedText = await this.extractTextFromPdf(file);

          if (!extractedText || extractedText.trim().length < 20) {
            throw new Error("This PDF appears to be a scanned image or contains no selectable text layer. Please paste the resume text directly.");
          }

          // Large input safety
          if (extractedText.length > 60000) {
            this.showToast("Extracted resume is very large. Optimizing first 60k characters.", "info", 3000);
          }

          this.resumeTextInput.value = extractedText;
          this.fileSizeLabel.textContent = `${fileSize} • Text extracted successfully`;
          this.resumeStatusNote.textContent = `PDF extracted (${file.name})`;
          this.showToast("PDF parsed successfully!", "success");
        } else {
          // Fallback to text reader for .txt, .md, .rtf, etc.
          const text = await this.readTextFile(file);
          this.resumeTextInput.value = text;
          this.fileSizeLabel.textContent = `${fileSize} • Text loaded`;
          this.resumeStatusNote.textContent = `File loaded (${file.name})`;
          this.showToast("Document loaded successfully!", "success");
        }
      } catch (err) {
        console.error("File extraction error:", err);
        let errorMsg = "Could not parse file. Switched to Paste view.";

        if (err.name === "PasswordException") {
          errorMsg = "This PDF is password-protected. Please upload an unlocked PDF or paste your text directly.";
        } else if (err.name === "InvalidPDFException") {
          errorMsg = "The file appears damaged or not a valid PDF. Please paste your resume text.";
        } else if (err.message && err.message.includes("scanned")) {
          errorMsg = err.message;
        }

        this.fileSizeLabel.textContent = `${fileSize} • Extraction issue`;
        this.showToast(errorMsg, "error", 4500);
        this.switchMode("paste");
      }

      this.updateCounters();
    }

    extractTextFromPdf(file) {
      return new Promise((resolve, reject) => {
        if (typeof pdfjsLib === "undefined") {
          return reject(new Error("PDF.js library not loaded"));
        }

        const reader = new FileReader();
        reader.onload = async (e) => {
          try {
            const typedarray = new Uint8Array(e.target.result);
            const pdf = await pdfjsLib.getDocument({ data: typedarray }).promise;
            let fullText = "";

            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items.map((item) => item.str).join(" ");
              fullText += pageText + "\n\n";
            }

            resolve(fullText.trim());
          } catch (err) {
            reject(err);
          }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
      });
    }

    readTextFile(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsText(file);
      });
    }

    clearUploadedFile() {
      this.fileInput.value = "";
      this.fileChipPreview.style.display = "none";
      this.dropzone.style.display = "flex";
      this.resumeTextInput.value = "";
      this.resumeStatusNote.textContent = "Ready for input";
      this.clearInputErrors();
      this.updateCounters();
      this.showToast("Uploaded file removed", "info", 1500);
    }

    /* ==========================================================================
       Counters & Text Helpers
       ========================================================================== */
    updateCounters() {
      const resumeText = this.resumeTextInput.value.trim();
      const resumeWords = resumeText ? resumeText.split(/\s+/).length : 0;
      const resumeChars = resumeText.length;
      this.resumeWordCount.textContent = `${resumeWords} words`;
      this.resumeCharCount.textContent = `${resumeChars} chars`;

      const jobText = this.jobTextInput.value.trim();
      const jobWords = jobText ? jobText.split(/\s+/).length : 0;
      const jobChars = jobText.length;
      this.jobWordCount.textContent = `${jobWords} words`;
      this.jobCharCount.textContent = `${jobChars} chars`;
    }

    clearInputErrors() {
      if (this.resumePanel) this.resumePanel.classList.remove("has-error");
      if (this.jobPanel) this.jobPanel.classList.remove("has-error");
      if (this.resumeErrorAlert) this.resumeErrorAlert.style.display = "none";
      if (this.jobErrorAlert) this.jobErrorAlert.style.display = "none";
    }

    /* ==========================================================================
       Sample Profile Loading
       ========================================================================== */
    loadSampleProfile(profileId) {
      if (!window.SAMPLE_PROFILES || !window.SAMPLE_PROFILES[profileId]) {
        this.showToast("Sample profile not found.", "error");
        return;
      }

      const sample = window.SAMPLE_PROFILES[profileId];
      this.resumeTextInput.value = sample.resume;
      this.jobTextInput.value = sample.jobDescription;
      this.clearInputErrors();

      // Update preset chips UI
      document.querySelectorAll(".preset-chip[data-profile]").forEach((chip) => {
        if (chip.getAttribute("data-profile") === profileId) {
          chip.classList.add("active");
        } else {
          chip.classList.remove("active");
        }
      });

      // Switch to paste view so user immediately sees populated resume
      this.switchMode("paste");
      this.updateCounters();
      this.showToast(`Loaded ${sample.title} profile`, "success");
    }

    resetWorkspace() {
      this.resumeTextInput.value = "";
      this.jobTextInput.value = "";
      this.clearUploadedFile();
      this.clearInputErrors();
      this.updateCounters();
      
      document.querySelectorAll(".preset-chip[data-profile]").forEach((chip) => {
        chip.classList.remove("active");
      });

      this.currentAnalysis = null;
      this.lastAnalyzedResume = "";
      this.lastAnalyzedJob = "";
      this.hideInputsModifiedBanner();
      this.showEmptyState();
      
      // Scroll smoothly back to workspace
      document.getElementById("analyzer").scrollIntoView({ behavior: "smooth" });
      this.showToast("Workspace reset. Ready for new input.", "info", 2000);
    }

    /* ==========================================================================
       Inputs Modification Tracker & Re-analysis Alert
       ========================================================================== */
    checkInputsModified() {
      if (!this.currentAnalysis) {
        this.hideInputsModifiedBanner();
        return;
      }
      const currentResume = (this.resumeTextInput.value || "").trim();
      const currentJob = (this.jobTextInput.value || "").trim();
      if (this.lastAnalyzedResume && (currentResume !== this.lastAnalyzedResume || currentJob !== this.lastAnalyzedJob)) {
        this.showInputsModifiedBanner();
      } else {
        this.hideInputsModifiedBanner();
      }
    }

    showInputsModifiedBanner() {
      if (this.inputsModifiedBanner) {
        this.inputsModifiedBanner.style.display = "flex";
      }
    }

    hideInputsModifiedBanner() {
      if (this.inputsModifiedBanner) {
        this.inputsModifiedBanner.style.display = "none";
      }
    }

    showEmptyState() {
      if (this.emptyStateSection) this.emptyStateSection.style.display = "block";
      if (this.resultsSection) this.resultsSection.classList.remove("active");
    }

    hideEmptyState() {
      if (this.emptyStateSection) this.emptyStateSection.style.display = "none";
      if (this.resultsSection) this.resultsSection.classList.add("active");
    }

    /* ==========================================================================
       AI Engine Management & Server Health Check
       ========================================================================== */
    async checkServerAiStatus() {
      try {
        const res = await fetch("/api/status", { cache: "no-store" });
        if (!res.ok) throw new Error("Status endpoint unavailable");
        const data = await res.json();

        this.serverAiAvailable = Boolean(data.aiConfigured);
        this.aiProviderName = data.provider || "none";
        this.aiModelName = data.model || "";

        if (this.serverAiAvailable) {
          if (this.engineStatusBadge) {
            this.engineStatusBadge.className = "badge badge-emerald";
          }
          if (this.engineStatusText) {
            this.engineStatusText.textContent = `✨ AI Active (${this.aiProviderName.toUpperCase()})`;
          }
          if (this.aiStatusHint) {
            this.aiStatusHint.textContent = `● Connected to ${this.aiProviderName.toUpperCase()} (${this.aiModelName})`;
            this.aiStatusHint.style.color = "var(--success)";
          }
          this.setEngineMode("ai");
        } else {
          if (this.engineStatusBadge) {
            this.engineStatusBadge.className = "badge badge-amber";
          }
          if (this.engineStatusText) {
            this.engineStatusText.textContent = "⚡ Baseline (AI Key Pending)";
          }
          if (this.aiStatusHint) {
            this.aiStatusHint.textContent = "⚠️ Server AI key pending. Baseline active as fallback.";
            this.aiStatusHint.style.color = "var(--warning)";
          }
          this.setEngineMode("ai");
        }
      } catch (err) {
        this.serverAiAvailable = false;
        if (this.engineStatusBadge) {
          this.engineStatusBadge.className = "badge badge-amber";
        }
        if (this.engineStatusText) {
          this.engineStatusText.textContent = "⚡ Heuristic Engine (Offline)";
        }
        if (this.aiStatusHint) {
          this.aiStatusHint.textContent = "Client mode (server endpoint offline). Baseline engine active.";
          this.aiStatusHint.style.color = "var(--text-muted)";
        }
        this.setEngineMode("baseline");
      }
    }

    setEngineMode(mode) {
      this.currentEngineMode = mode;
      if (this.modeAiBtn && this.modeBaselineBtn) {
        if (mode === "ai") {
          this.modeAiBtn.classList.add("active");
          this.modeAiBtn.setAttribute("aria-checked", "true");
          this.modeBaselineBtn.classList.remove("active");
          this.modeBaselineBtn.setAttribute("aria-checked", "false");
          if (this.analyzeBtnLabel) this.analyzeBtnLabel.textContent = "Analyze with Real AI";
        } else {
          this.modeAiBtn.classList.remove("active");
          this.modeAiBtn.setAttribute("aria-checked", "false");
          this.modeBaselineBtn.classList.add("active");
          this.modeBaselineBtn.setAttribute("aria-checked", "true");
          if (this.analyzeBtnLabel) this.analyzeBtnLabel.textContent = "Analyze with Baseline";
        }
      }
    }

    /* ==========================================================================
       Analysis Execution & Multi-Stage Scanner Animation
       ========================================================================== */
    triggerAnalysis() {
      const resume = this.resumeTextInput.value.trim();
      const job = this.jobTextInput.value.trim();

      this.clearInputErrors();
      let hasError = false;

      // Validate resume bounds
      const resumeWords = resume ? resume.split(/\s+/).filter(Boolean).length : 0;
      if (!resume || resumeWords < 15) {
        hasError = true;
        this.resumePanel.classList.add("has-error");
        this.shakeElement(this.resumePanel);
        this.resumeErrorAlert.innerHTML = `⚠️ Please enter your resume text or upload a document (minimum 15 words required).`;
        this.resumeErrorAlert.style.display = "flex";
        if (this.currentMode === "upload" && !this.fileInput.value) {
          this.switchMode("paste");
        }
      } else if (resume.length > 40000) {
        hasError = true;
        this.resumePanel.classList.add("has-error");
        this.shakeElement(this.resumePanel);
        this.resumeErrorAlert.innerHTML = `⚠️ Resume exceeds 40,000 characters limit (${resume.length.toLocaleString()} chars). Please shorten.`;
        this.resumeErrorAlert.style.display = "flex";
      }

      // Validate job description bounds
      const jobWords = job ? job.split(/\s+/).filter(Boolean).length : 0;
      if (!job || jobWords < 15) {
        hasError = true;
        this.jobPanel.classList.add("has-error");
        this.shakeElement(this.jobPanel);
        this.jobErrorAlert.innerHTML = `⚠️ Please provide the target job description (minimum 15 words required for skill extraction).`;
        this.jobErrorAlert.style.display = "flex";
      } else if (job.length > 40000) {
        hasError = true;
        this.jobPanel.classList.add("has-error");
        this.shakeElement(this.jobPanel);
        this.jobErrorAlert.innerHTML = `⚠️ Job description exceeds 40,000 characters limit (${job.length.toLocaleString()} chars). Please shorten.`;
        this.jobErrorAlert.style.display = "flex";
      }

      if (hasError) {
        this.showToast("Please provide valid resume and job description to proceed.", "error", 3000);
        return;
      }

      // Save last inputs for retry / fallback actions
      this.lastSubmittedResume = resume;
      this.lastSubmittedJob = job;

      // Large input check notification
      if (resume.length > 30000 || job.length > 30000) {
        this.showToast("Analyzing large inputs; optimized parsing enabled.", "info", 2500);
      }

      // Launch chosen engine
      if (this.currentEngineMode === "ai") {
        this.runAiAnalysis(resume, job);
      } else {
        this.runScannerSimulation(resume, job);
      }
    }

    shakeElement(el) {
      if (!el) return;
      el.style.animation = "none";
      el.offsetHeight; // trigger reflow
      el.style.animation = "shake 0.4s ease";
      setTimeout(() => (el.style.animation = ""), 500);
    }

    cancelAnalysis(hideOverlay = true) {
      if (this.scannerTimer) {
        clearTimeout(this.scannerTimer);
        this.scannerTimer = null;
      }
      if (this.activeAbortController) {
        this.activeAbortController.abort();
        this.activeAbortController = null;
      }
      if (hideOverlay) {
        this.scannerOverlay.classList.remove("active");
        this.showToast("Analysis cancelled.", "info", 1500);
      }
    }

    /* ==========================================================================
       Real LLM-Powered Analysis Pipeline
       ========================================================================== */
    async runAiAnalysis(resume, job) {
      this.cancelAnalysis(false);
      this.scannerOverlay.classList.add("active");
      if (this.scannerActiveContent) this.scannerActiveContent.style.display = "block";
      if (this.scannerErrorBox) this.scannerErrorBox.style.display = "none";
      if (this.scannerRadarIcon) this.scannerRadarIcon.textContent = "✨";

      // Set engine label
      if (this.scannerEngineBadge) {
        this.scannerEngineBadge.className = "badge badge-ai";
        const prov = this.aiProviderName && this.aiProviderName !== "none" ? this.aiProviderName.toUpperCase() : "LLM";
        this.scannerEngineBadge.textContent = `✨ Calling Server-Side ${prov} Engine...`;
      }

      this.scannerProgressFill.style.width = "10%";

      // Reset step indicators
      this.steps.forEach((step) => {
        if (step) step.classList.remove("active", "completed");
      });
      if (this.steps[0]) this.steps[0].classList.add("active");

      const stages = [
        { progress: 25, text: "Connecting to secure LLM endpoint & authenticating...", step: 0 },
        { progress: 48, text: "Parsing semantic competencies & candidate experience...", step: 1 },
        { progress: 70, text: "Benchmarking against Job Description requirements...", step: 2 },
        { progress: 88, text: "Validating schema-constrained JSON output & scores...", step: 3 }
      ];

      let stageIdx = 0;
      const advanceAiStages = () => {
        if (stageIdx < stages.length) {
          const s = stages[stageIdx];
          this.scannerProgressFill.style.width = s.progress + "%";
          this.scannerStageText.textContent = s.text;
          if (s.step > 0 && this.steps[s.step - 1]) {
            this.steps[s.step - 1].classList.remove("active");
            this.steps[s.step - 1].classList.add("completed");
          }
          if (this.steps[s.step]) {
            this.steps[s.step].classList.add("active");
          }
          stageIdx++;
          this.scannerTimer = setTimeout(advanceAiStages, 1400);
        }
      };
      advanceAiStages();

      // Configure AbortController with 40s timeout
      this.activeAbortController = new AbortController();
      const timeoutId = setTimeout(() => {
        if (this.activeAbortController) {
          this.activeAbortController.abort("TIMEOUT");
        }
      }, 40000);

      try {
        const response = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resumeText: resume, jobText: job }),
          signal: this.activeAbortController.signal
        });

        clearTimeout(timeoutId);
        if (this.scannerTimer) {
          clearTimeout(this.scannerTimer);
          this.scannerTimer = null;
        }

        const data = await response.json().catch(() => ({}));

        if (!response.ok || !data.success) {
          const errMsg = data.message || `Server returned HTTP ${response.status} (${response.statusText})`;
          const errCode = data.error || "AI_REQUEST_FAILED";
          throw { code: errCode, message: errMsg, fallbackAvailable: data.fallbackAvailable !== false };
        }

        // Complete 100% stage
        this.scannerProgressFill.style.width = "100%";
        this.scannerStageText.textContent = "Synthesizing tailored interview questions & actionable roadmap...";
        this.steps.forEach((s) => {
          if (s) {
            s.classList.remove("active");
            s.classList.add("completed");
          }
        });

        setTimeout(() => {
          this.scannerOverlay.classList.remove("active");
          this.completeAnalysisWithAi(data.data);
        }, 400);

      } catch (err) {
        clearTimeout(timeoutId);
        if (this.scannerTimer) {
          clearTimeout(this.scannerTimer);
          this.scannerTimer = null;
        }

        let errorTitle = "AI Analysis Service Error";
        let errorMessage = err.message || "An unexpected error occurred while communicating with the AI service.";

        if (err.name === "AbortError" || err === "TIMEOUT") {
          errorTitle = "AI Analysis Timed Out";
          errorMessage = "The AI service did not respond within 40 seconds. You can retry with AI or immediately run the instant offline baseline analyzer.";
        } else if (err.code === "AI_SERVICE_UNCONFIGURED") {
          errorTitle = "AI Provider Not Configured";
          errorMessage = "No AI API key is configured on the server. Please set GEMINI_API_KEY in your server environment (.env). You can run the offline baseline analyzer right now.";
        } else if (err.code === "AI_AUTH_FAILED") {
          errorTitle = "AI Authentication Failed";
          errorMessage = "The configured API key was rejected by the AI provider. Please verify your GEMINI_API_KEY. You can use the baseline analyzer in the meantime.";
        } else if (err.code === "AI_RATE_LIMITED") {
          errorTitle = "AI Rate Limit Reached";
          errorMessage = "The AI provider rate limit was reached. Please wait a moment before retrying, or switch to the baseline analyzer.";
        } else if (err.code && err.code.startsWith("VALIDATION_")) {
          errorTitle = "Input Validation Failed";
          errorMessage = err.message;
        }

        this.showScannerError(errorTitle, errorMessage);
      } finally {
        this.activeAbortController = null;
      }
    }

    showScannerError(title, message) {
      if (this.scannerActiveContent) this.scannerActiveContent.style.display = "none";
      if (this.scannerErrorBox) {
        if (this.scannerErrorTitle) this.scannerErrorTitle.textContent = title;
        if (this.scannerErrorMsg) this.scannerErrorMsg.textContent = message;
        this.scannerErrorBox.style.display = "block";
      }
      this.scannerOverlay.classList.add("active");
    }

    dismissScannerError() {
      if (this.scannerOverlay) this.scannerOverlay.classList.remove("active");
      if (this.scannerErrorBox) this.scannerErrorBox.style.display = "none";
      if (this.scannerActiveContent) this.scannerActiveContent.style.display = "block";
    }

    retryAiAnalysis() {
      this.dismissScannerError();
      if (this.lastSubmittedResume && this.lastSubmittedJob) {
        this.runAiAnalysis(this.lastSubmittedResume, this.lastSubmittedJob);
      } else {
        this.triggerAnalysis();
      }
    }

    runBaselineFallback() {
      this.dismissScannerError();
      this.showToast("Switching to offline baseline analyzer...", "info", 1800);
      if (this.lastSubmittedResume && this.lastSubmittedJob) {
        this.runScannerSimulation(this.lastSubmittedResume, this.lastSubmittedJob);
      } else {
        this.triggerAnalysis();
      }
    }

    completeAnalysisWithAi(aiData) {
      try {
        this.currentAnalysis = aiData;
        this.lastAnalyzedResume = (this.resumeTextInput.value || "").trim();
        this.lastAnalyzedJob = (this.jobTextInput.value || "").trim();
        this.hideInputsModifiedBanner();

        // Update results badge
        if (this.resultsEngineBadge) {
          this.resultsEngineBadge.className = "badge badge-ai";
          const prov = this.aiProviderName && this.aiProviderName !== "none" ? this.aiProviderName.toUpperCase() : "LLM";
          this.resultsEngineBadge.textContent = `✨ Real ${prov} AI Analysis`;
        }

        // Render dynamic dashboard from structured AI data
        this.renderResults(aiData);

        // Hide Empty State and Show Results
        this.hideEmptyState();
        this.resultsSection.scrollIntoView({ behavior: "smooth" });

        this.showToast(`AI Analysis complete! Evaluated via ${this.aiProviderName.toUpperCase()}.`, "success");

        // Celebration confetti if score >= 80
        if (aiData.scores.overall >= 80 && typeof confetti === "function") {
          confetti({
            particleCount: 90,
            spread: 75,
            origin: { y: 0.55 },
            colors: ["#6366f1", "#10b981", "#a855f7", "#06b6d4"]
          });
        }
      } catch (err) {
        console.error("AI rendering error:", err);
        this.showToast("Rendering error: " + err.message, "error");
      }
    }

    /* ==========================================================================
       Baseline Heuristic Analysis Simulation & Fallback
       ========================================================================== */
    runScannerSimulation(resume, job) {
      this.cancelAnalysis(false);
      this.scannerOverlay.classList.add("active");
      if (this.scannerActiveContent) this.scannerActiveContent.style.display = "block";
      if (this.scannerErrorBox) this.scannerErrorBox.style.display = "none";
      if (this.scannerRadarIcon) this.scannerRadarIcon.textContent = "⚡";

      if (this.scannerEngineBadge) {
        this.scannerEngineBadge.className = "badge badge-heuristic";
        this.scannerEngineBadge.textContent = "⚡ Local Baseline Heuristic Engine";
      }

      this.scannerProgressFill.style.width = "0%";

      // Reset step indicators
      this.steps.forEach((step) => {
        if (step) step.classList.remove("active", "completed");
      });

      const stages = [
        { progress: 20, text: "Parsing contact data and section hierarchy...", stepIndex: 0 },
        { progress: 42, text: "Extracting verified tech stack & skill competencies...", stepIndex: 1 },
        { progress: 65, text: "Benchmarking against Job Description requirements...", stepIndex: 2 },
        { progress: 85, text: "Calculating baseline skill match & ATS compliance...", stepIndex: 3 },
        { progress: 100, text: "Synthesizing tailored interview questions & actionable plan...", stepIndex: 4 }
      ];

      let currentIndex = 0;

      const advanceStage = () => {
        if (currentIndex < stages.length) {
          const stage = stages[currentIndex];
          this.scannerProgressFill.style.width = stage.progress + "%";
          this.scannerStageText.textContent = stage.text;

          if (stage.stepIndex > 0 && this.steps[stage.stepIndex - 1]) {
            this.steps[stage.stepIndex - 1].classList.remove("active");
            this.steps[stage.stepIndex - 1].classList.add("completed");
          }
          if (this.steps[stage.stepIndex]) {
            this.steps[stage.stepIndex].classList.add("active");
          }

          currentIndex++;
          this.scannerTimer = setTimeout(advanceStage, 280);
        } else {
          // Completed
          if (this.steps[stages.length - 1]) {
            this.steps[stages.length - 1].classList.remove("active");
            this.steps[stages.length - 1].classList.add("completed");
          }

          this.scannerTimer = setTimeout(() => {
            this.scannerOverlay.classList.remove("active");
            this.completeAnalysis(resume, job);
          }, 350);
        }
      };

      advanceStage();
    }

    completeAnalysis(resume, job) {
      try {
        const result = this.analyzer.analyze(resume, job);
        result.isAi = false;
        this.currentAnalysis = result;
        this.lastAnalyzedResume = resume.trim();
        this.lastAnalyzedJob = job.trim();
        this.hideInputsModifiedBanner();

        // Update results badge
        if (this.resultsEngineBadge) {
          this.resultsEngineBadge.className = "badge badge-heuristic";
          this.resultsEngineBadge.textContent = "⚡ Baseline Heuristic Analysis";
        }

        // Render dynamic dashboard from structured JS data
        this.renderResults(result);

        // Hide Empty State and Show Results
        this.hideEmptyState();
        this.resultsSection.scrollIntoView({ behavior: "smooth" });

        this.showToast("Baseline analysis complete! Review your estimate below.", "info");

        // Celebration confetti if score >= 80
        if (result.scores.overall >= 80 && typeof confetti === "function") {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.55 },
            colors: ["#6366f1", "#10b981", "#06b6d4", "#8b5cf6"]
          });
        }
      } catch (err) {
        console.error("Analysis error:", err);
        this.showToast("Analysis error: " + err.message, "error");
      }
    }

    /* ==========================================================================
       Render Dashboard Results
       ========================================================================== */
    renderResults(data) {
      // Header Info
      const name = data.candidateName || "Candidate";
      this.candidateNameDisplay.textContent = name;
      const initials = name.split(" ").map((n) => n[0]).join("").toUpperCase().substring(0, 2) || "CL";
      this.candidateAvatar.textContent = initials;
      this.targetRoleDisplay.textContent = data.targetRole || "Target Position";
      this.analysisTimestamp.textContent = data.timestamp;

      // Deterministic vs AI Dual-Score Distinction
      const isAi = data.isAi !== false;
      const detMetrics = data.deterministicMetrics || {
        matchedCount: data.skills.matched.length,
        totalSkillsCount: (data.skills.matched.length + data.skills.missing.length),
        deterministicScore: data.scores.skills
      };

      if (this.mainScoreTypeBadge) {
        if (isAi) {
          this.mainScoreTypeBadge.className = "badge badge-ai";
          this.mainScoreTypeBadge.textContent = "✨ AI Match Assessment";
        } else {
          this.mainScoreTypeBadge.className = "badge badge-heuristic";
          this.mainScoreTypeBadge.textContent = "⚡ Baseline Heuristic Score";
        }
      }

      if (this.deterministicBadgeSummary && this.deterministicScorePercent) {
        this.deterministicScorePercent.textContent = `${detMetrics.deterministicScore || data.scores.skills}%`;
      }

      if (this.aiSemanticScoreVal) {
        this.aiSemanticScoreVal.textContent = `${data.scores.overall}%`;
      }
      if (this.aiSemanticScoreSub) {
        this.aiSemanticScoreSub.textContent = isAi ? "Semantic & project depth" : "Multi-factor weighted estimate";
      }
      if (this.deterministicScoreVal) {
        this.deterministicScoreVal.textContent = `${detMetrics.deterministicScore || data.scores.skills}%`;
      }
      if (this.deterministicScoreCaption) {
        this.deterministicScoreCaption.textContent = `${detMetrics.matchedCount} of ${detMetrics.totalSkillsCount} taxonomy keywords`;
      }

      // Radial Gauge Animation
      this.animateRadialGauge(data.scores.overall, data.scores.rating, data.scores.tone);

      // Transparent Formula Breakdown
      if (data.transparency) {
        this.formulaSkillsText.textContent = data.transparency.formulaExplanation;
        this.formulaAtsText.textContent = `${data.scores.ats}% formatting & section compliance`;
        this.formulaExpText.textContent = `${data.scores.experience}% seniority alignment (${data.expData.details})`;
        this.formulaKeyText.textContent = `${data.scores.keywords}% target keyword density`;
      }

      // Submetrics
      this.skillMatchVal.textContent = data.scores.skills + "%";
      this.skillMatchBar.style.width = data.scores.skills + "%";

      this.atsScoreVal.textContent = data.scores.ats + "%";
      this.atsScoreBar.style.width = data.scores.ats + "%";

      this.experienceVal.textContent = data.scores.experience + "%";
      this.experienceBar.style.width = data.scores.experience + "%";

      this.keywordVal.textContent = data.scores.keywords + "%";
      this.keywordBar.style.width = data.scores.keywords + "%";

      // Domain Category Breakdown (Accessible Progress Bars)
      this.renderCategoryBreakdown(data.deterministicMetrics?.categoryBreakdown || data.skills?.categoryBreakdown);

      // Skills Lists
      this.matchedCount.textContent = data.skills.matched.length;
      this.missingCount.textContent = data.skills.missing.length;
      this.renderFilteredSkills();

      // Keyword Bar Chart
      this.renderKeywordChart(data.keywordChart);

      // Strengths & Weaknesses
      this.renderStrengths(data.strengths);
      this.renderWeaknesses(data.weaknesses);

      // Recommendations
      this.renderRecommendations(data.recommendations);

      // Personalized Skill-Gap Learning Roadmap
      this.renderLearningRoadmap(data.learningRoadmap);

      // Tailored Interview Questions
      this.renderFilteredQuestions();

      // Set initial bullet in optimizer if empty
      if (!this.bulletInputText.value) {
        this.bulletInputText.value = "Responsible for writing APIs and managing backend microservices for the payments team.";
        this.runBulletOptimizer();
      }
    }

    toggleFormulaDetails() {
      if (!this.formulaBody) return;
      const isHidden = this.formulaBody.style.display === "none";
      this.formulaBody.style.display = isHidden ? "flex" : "none";
      if (this.formulaArrow) {
        this.formulaArrow.textContent = isHidden ? "▲" : "▼";
      }
    }

    animateRadialGauge(targetScore, rating, tone) {
      const circle = this.gaugeProgressCircle;
      const scoreEl = this.overallScoreDisplay;
      const badge = this.ratingBadge;

      const circumference = 2 * Math.PI * 90; // ~565.48
      const offset = circumference - (targetScore / 100) * circumference;

      // Color selection
      let strokeColor = "#10b981"; // emerald
      if (targetScore < 60) strokeColor = "#ef4444";
      else if (targetScore < 75) strokeColor = "#f59e0b";

      circle.style.stroke = strokeColor;
      circle.style.strokeDashoffset = offset;

      // Badge
      badge.textContent = rating;
      badge.className = `badge badge-${tone} gauge-rating-badge`;

      // Verdict note with explicit estimate labeling
      if (targetScore >= 85) {
        this.scoreVerdictNote.textContent =
          "Exceptional baseline alignment! Your resume exhibits high technical overlap with required job skills.";
      } else if (targetScore >= 75) {
        this.scoreVerdictNote.textContent =
          "Strong baseline match. With a few missing keywords and quantified metrics added, your profile is well positioned.";
      } else if (targetScore >= 60) {
        this.scoreVerdictNote.textContent =
          "Moderate match. Core background matches, but several high-frequency skills from the listing are missing.";
      } else {
        this.scoreVerdictNote.textContent =
          "Significant alignment gap. We recommend tailoring your resume specifically for this position before submitting.";
      }

      // Number counter animation
      let start = 0;
      const duration = 1200;
      const startTime = performance.now();

      const animateCount = (now) => {
        const elapsed = now - startTime;
        const progress = Math.min(1, elapsed / duration);
        const current = Math.round(progress * targetScore);
        scoreEl.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(animateCount);
        } else {
          scoreEl.textContent = targetScore;
        }
      };

      requestAnimationFrame(animateCount);
    }

    /* ==========================================================================
       Render Skill Gap Matrix & Filter (Safe DOM Construction)
       ========================================================================== */
    renderFilteredSkills() {
      if (!this.currentAnalysis) return;

      const category = this.activeSkillCategory;
      const matched = (this.currentAnalysis.skills?.matched || []).filter(
        (s) => category === "all" || s.category === category
      );
      const missing = (this.currentAnalysis.skills?.missing || []).filter(
        (s) => category === "all" || s.category === category
      );

      // Render Matched Skills
      this.matchedSkillsTags.textContent = "";
      if (matched.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.style.fontSize = "0.8125rem";
        emptyNote.style.color = "var(--text-muted)";
        emptyNote.style.padding = "1rem 0";
        emptyNote.textContent = `No matched skills in category "${category}".`;
        this.matchedSkillsTags.appendChild(emptyNote);
      } else {
        matched.forEach((skill) => {
          const el = document.createElement("div");
          el.className = "skill-badge skill-badge-matched";

          const spanText = document.createElement("span");
          spanText.textContent = `✓ ${skill.name}`;

          const metaSpan = document.createElement("span");
          metaSpan.className = "badge-tag-meta";
          metaSpan.textContent = skill.context ? skill.category : `${skill.frequency || 1}x`;

          el.appendChild(spanText);
          el.appendChild(metaSpan);
          if (skill.context) {
            el.title = skill.context;
          }
          this.matchedSkillsTags.appendChild(el);
        });
      }

      // Render Missing Skills
      this.missingSkillsTags.textContent = "";
      if (missing.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.style.fontSize = "0.8125rem";
        emptyNote.style.color = "var(--text-muted)";
        emptyNote.style.padding = "1rem 0";
        emptyNote.textContent = `No missing skills in category "${category}"! Great job.`;
        this.missingSkillsTags.appendChild(emptyNote);
      } else {
        missing.forEach((skill) => {
          const el = document.createElement("div");
          el.className = "skill-badge skill-badge-missing";
          el.title = `Required in job description`;

          const spanText = document.createElement("span");
          spanText.textContent = `✕ ${skill.name}`;

          const metaSpan = document.createElement("span");
          metaSpan.className = "badge-tag-meta";
          metaSpan.textContent = skill.importance || "Recommended";

          el.appendChild(spanText);
          el.appendChild(metaSpan);
          this.missingSkillsTags.appendChild(el);
        });
      }
    }

    /* ==========================================================================
       Keyword Density Comparison Chart (Safe DOM Construction)
       ========================================================================== */
    renderKeywordChart(chartList) {
      this.keywordBarsContainer.textContent = "";

      if (!chartList || chartList.length === 0) {
        // Fallback chart from matched & missing skills
        const topMatched = (this.currentAnalysis.skills?.matched || []).slice(0, 5).map(s => ({
          keyword: s.name,
          category: s.category,
          resumeCount: s.frequency || 3,
          jobCount: 4
        }));
        const topMissing = (this.currentAnalysis.skills?.missing || []).slice(0, 3).map(s => ({
          keyword: s.name,
          category: s.category,
          resumeCount: 0,
          jobCount: 3
        }));
        chartList = [...topMatched, ...topMissing];
      }

      if (chartList.length === 0) {
        const emptyP = document.createElement("p");
        emptyP.style.fontSize = "0.8125rem";
        emptyP.textContent = "No keyword comparison available.";
        this.keywordBarsContainer.appendChild(emptyP);
        return;
      }

      const maxVal = Math.max(...chartList.map((c) => Math.max(c.resumeCount || 0, c.jobCount || 0, 1)));

      chartList.forEach((item) => {
        const resCount = item.resumeCount || 0;
        const jCount = item.jobCount || 0;
        const resumePct = Math.round((resCount / maxVal) * 100);
        const jobPct = Math.round((jCount / maxVal) * 100);

        const row = document.createElement("div");
        row.className = "chart-bar-item";

        const label = document.createElement("div");
        label.className = "chart-bar-label";
        label.title = `${item.keyword} (${item.category || "Skill"})`;
        label.textContent = item.keyword;

        const track = document.createElement("div");
        track.className = "chart-comparison-track";

        const jobBar = document.createElement("div");
        jobBar.className = "chart-bar-job";
        jobBar.style.width = `${jobPct}%`;
        jobBar.title = `Job target: ${jCount}`;

        const resBar = document.createElement("div");
        resBar.className = "chart-bar-resume";
        resBar.style.width = `${resumePct}%`;
        resBar.title = `Resume: ${resCount}`;

        track.appendChild(jobBar);
        track.appendChild(resBar);

        const stats = document.createElement("div");
        stats.className = "chart-bar-stats";
        stats.textContent = `${resCount} vs ${jCount}`;

        row.appendChild(label);
        row.appendChild(track);
        row.appendChild(stats);
        this.keywordBarsContainer.appendChild(row);
      });
    }

    /* ==========================================================================
       Domain Category Match Breakdown (Accessible Progress Bars)
       ========================================================================== */
    renderCategoryBreakdown(categories) {
      if (!this.categoryBarsGrid) return;
      this.categoryBarsGrid.textContent = "";

      const cats = Array.isArray(categories) && categories.length > 0 ? categories : [];
      if (cats.length === 0) {
        if (this.categoryBreakdownCard) this.categoryBreakdownCard.style.display = "none";
        return;
      }
      if (this.categoryBreakdownCard) this.categoryBreakdownCard.style.display = "block";

      cats.forEach((cat) => {
        const row = document.createElement("div");
        row.className = "category-bar-row";

        const meta = document.createElement("div");
        meta.className = "category-bar-meta";

        const name = document.createElement("span");
        name.className = "category-name";
        name.textContent = cat.category;

        const stat = document.createElement("span");
        stat.className = "category-stat";
        stat.textContent = `${cat.matchedCount} of ${cat.totalCount} matched (${cat.percentage}%)`;

        meta.appendChild(name);
        meta.appendChild(stat);

        const track = document.createElement("div");
        track.className = "progress-track";
        track.style.height = "8px";

        const fill = document.createElement("div");
        fill.className = "progress-bar";
        fill.setAttribute("role", "progressbar");
        fill.setAttribute("aria-valuenow", String(cat.percentage));
        fill.setAttribute("aria-valuemin", "0");
        fill.setAttribute("aria-valuemax", "100");
        fill.setAttribute("aria-label", `${cat.category} match progress: ${cat.percentage}%`);
        fill.style.width = `${cat.percentage}%`;

        if (cat.percentage >= 75) {
          fill.style.background = "var(--grad-emerald)";
        } else if (cat.percentage >= 40) {
          fill.style.background = "linear-gradient(90deg, #f59e0b, #eab308)";
        } else {
          fill.style.background = "linear-gradient(90deg, #f43f5e, #e11d48)";
        }

        track.appendChild(fill);
        row.appendChild(meta);
        row.appendChild(track);
        this.categoryBarsGrid.appendChild(row);
      });
    }

    /* ==========================================================================
       Strengths & Weaknesses (Safe DOM Construction)
       ========================================================================== */
    renderStrengths(strengths) {
      this.strengthsList.textContent = "";
      (strengths || []).forEach((item) => {
        const row = document.createElement("div");
        row.className = "insight-item";

        const iconWrap = document.createElement("div");
        iconWrap.className = "insight-item-icon success";
        iconWrap.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>`;

        const content = document.createElement("div");
        content.className = "insight-item-content";

        const h4 = document.createElement("h4");
        h4.textContent = item.title;

        const p = document.createElement("p");
        p.textContent = item.desc;

        content.appendChild(h4);
        content.appendChild(p);
        row.appendChild(iconWrap);
        row.appendChild(content);
        this.strengthsList.appendChild(row);
      });
    }

    renderWeaknesses(weaknesses) {
      this.weaknessesList.textContent = "";
      (weaknesses || []).forEach((item) => {
        const priorityColor = item.priority === "High" ? "badge-rose" : "badge-amber";
        const row = document.createElement("div");
        row.className = "insight-item";

        const iconWrap = document.createElement("div");
        iconWrap.className = "insight-item-icon warning";
        iconWrap.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`;

        const content = document.createElement("div");
        content.className = "insight-item-content";

        const topFlex = document.createElement("div");
        topFlex.style.display = "flex";
        topFlex.style.alignItems = "center";
        topFlex.style.gap = "0.5rem";
        topFlex.style.marginBottom = "0.25rem";

        const h4 = document.createElement("h4");
        h4.textContent = item.title;

        const badge = document.createElement("span");
        badge.className = `badge ${priorityColor}`;
        badge.style.fontSize = "0.6875rem";
        badge.style.padding = "0.15rem 0.5rem";
        badge.textContent = item.priority || "Action";

        topFlex.appendChild(h4);
        topFlex.appendChild(badge);

        const p = document.createElement("p");
        p.textContent = item.desc;

        content.appendChild(topFlex);
        content.appendChild(p);
        row.appendChild(iconWrap);
        row.appendChild(content);
        this.weaknessesList.appendChild(row);
      });
    }

    /* ==========================================================================
       Recommendations Plan (Safe DOM Construction)
       ========================================================================== */
    renderRecommendations(recs) {
      this.recsList.textContent = "";
      (recs || []).forEach((rec) => {
        const row = document.createElement("div");
        row.className = "rec-step-row";

        const num = document.createElement("div");
        num.className = "rec-step-number";
        num.textContent = rec.step;

        const info = document.createElement("div");
        info.className = "rec-step-info";

        const h4 = document.createElement("h4");
        h4.textContent = rec.title;

        const p = document.createElement("p");
        p.textContent = rec.action;

        info.appendChild(h4);
        info.appendChild(p);
        row.appendChild(num);
        row.appendChild(info);
        this.recsList.appendChild(row);
      });
    }

    copyRecommendations() {
      if (!this.currentAnalysis || !this.currentAnalysis.recommendations || !this.currentAnalysis.recommendations.length) {
        this.showToast("No recommendations available to copy.", "info");
        return;
      }
      const role = this.currentAnalysis.targetRole || "Target Position";
      const recs = this.currentAnalysis.recommendations;
      let text = `# CareerLens AI — Step-by-Step Optimization Roadmap\n**Target Role:** ${role}\n\n`;
      recs.forEach((r, idx) => {
        text += `### Step ${r.step || (idx + 1)}: ${r.title}\n${r.action}\n\n`;
      });

      navigator.clipboard.writeText(text).then(() => {
        this.showToast("Recommendations copied to clipboard!", "success");
      }).catch(() => {
        this.showToast("Copied to clipboard!", "success");
      });
    }

    /* ==========================================================================
       Personalized Skill-Gap Learning Roadmap (Safe DOM & Persistence)
       ========================================================================== */
    renderLearningRoadmap(roadmap) {
      if (!this.roadmapPhasesGrid) return;
      this.roadmapPhasesGrid.textContent = "";

      const items = Array.isArray(roadmap) && roadmap.length > 0 ? roadmap : [];
      if (items.length === 0) {
        if (this.learningRoadmapSection) this.learningRoadmapSection.style.display = "none";
        return;
      }
      if (this.learningRoadmapSection) this.learningRoadmapSection.style.display = "block";

      // Load saved checklist milestone IDs from localStorage
      const storageKey = "careerlens_roadmap_checked";
      let checkedIds = new Set();
      try {
        const saved = JSON.parse(localStorage.getItem(storageKey) || "[]");
        if (Array.isArray(saved)) checkedIds = new Set(saved);
      } catch (e) {
        checkedIds = new Set();
      }

      const updateTracker = () => {
        const total = items.length;
        let completed = 0;
        items.forEach((it) => {
          const mId = `step_${it.step}_${it.skill}`;
          if (checkedIds.has(mId)) completed++;
        });
        const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
        if (this.roadmapCompletedCount) this.roadmapCompletedCount.textContent = completed;
        if (this.roadmapTotalCount) this.roadmapTotalCount.textContent = total;
        if (this.roadmapPercentText) this.roadmapPercentText.textContent = `${pct}%`;
        if (this.roadmapProgressBar) {
          this.roadmapProgressBar.style.width = `${pct}%`;
          this.roadmapProgressBar.setAttribute("aria-valuenow", String(pct));
        }
      };

      items.forEach((milestone) => {
        const milestoneId = `step_${milestone.step}_${milestone.skill}`;
        const isChecked = checkedIds.has(milestoneId);

        const card = document.createElement("div");
        card.className = `roadmap-milestone-card glass-card ${isChecked ? "completed" : ""}`;

        // Top Row: Phase badge & Estimated hours
        const topRow = document.createElement("div");
        topRow.className = "roadmap-card-top";

        const phaseBadge = document.createElement("span");
        phaseBadge.className = "badge badge-primary roadmap-phase-badge";
        phaseBadge.textContent = milestone.phase || `Phase ${milestone.step}`;

        const hoursBadge = document.createElement("span");
        hoursBadge.className = "badge badge-secondary roadmap-hours-badge";
        hoursBadge.textContent = `⏱️ ${milestone.estimatedHours || "10-15 hrs"}`;

        topRow.appendChild(phaseBadge);
        topRow.appendChild(hoursBadge);

        // Body with checkbox and title
        const bodyRow = document.createElement("div");
        bodyRow.className = "roadmap-card-body";

        const checkLabel = document.createElement("label");
        checkLabel.className = "roadmap-check-label";

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "roadmap-checkbox";
        checkbox.checked = isChecked;
        checkbox.setAttribute("aria-label", `Mark milestone: ${milestone.title} as completed`);

        const customBox = document.createElement("span");
        customBox.className = "roadmap-custom-check";

        checkLabel.appendChild(checkbox);
        checkLabel.appendChild(customBox);

        const textGroup = document.createElement("div");
        textGroup.className = "roadmap-text-group";

        const titleEl = document.createElement("h4");
        titleEl.className = "roadmap-milestone-title";
        titleEl.textContent = milestone.title;

        const actionEl = document.createElement("p");
        actionEl.className = "roadmap-milestone-action";
        actionEl.textContent = milestone.action;

        textGroup.appendChild(titleEl);
        textGroup.appendChild(actionEl);

        bodyRow.appendChild(checkLabel);
        bodyRow.appendChild(textGroup);

        // Practical Project Deliverable Box
        const projectBox = document.createElement("div");
        projectBox.className = "roadmap-project-box";

        const projIcon = document.createElement("span");
        projIcon.className = "roadmap-project-icon";
        projIcon.textContent = "💡";

        const projText = document.createElement("div");
        projText.className = "roadmap-project-desc";
        const projStrong = document.createElement("strong");
        projStrong.textContent = "Portfolio Project: ";
        const projContent = document.createTextNode(milestone.projectIdea || "Build a real-world project demonstrating this technology.");
        projText.appendChild(projStrong);
        projText.appendChild(projContent);

        projectBox.appendChild(projIcon);
        projectBox.appendChild(projText);

        // Toggle checkbox listener
        checkbox.addEventListener("change", () => {
          if (checkbox.checked) {
            checkedIds.add(milestoneId);
            card.classList.add("completed");
          } else {
            checkedIds.delete(milestoneId);
            card.classList.remove("completed");
          }
          try {
            localStorage.setItem(storageKey, JSON.stringify(Array.from(checkedIds)));
          } catch (e) {}
          updateTracker();
        });

        card.appendChild(topRow);
        card.appendChild(bodyRow);
        card.appendChild(projectBox);
        this.roadmapPhasesGrid.appendChild(card);
      });

      updateTracker();
    }

    copyLearningRoadmap() {
      if (!this.currentAnalysis || !this.currentAnalysis.learningRoadmap || !this.currentAnalysis.learningRoadmap.length) {
        this.showToast("No active learning roadmap to copy.", "info");
        return;
      }
      const role = this.currentAnalysis.targetRole || "Target Position";
      const items = this.currentAnalysis.learningRoadmap;
      let text = `# CareerLens AI — 6-Week Skill-Gap Learning Roadmap\n**Target Role:** ${role}\n\n`;

      items.forEach((m, idx) => {
        text += `### Phase ${idx + 1}: ${m.phase || `Phase ${m.step}`}\n`;
        text += `**Competency:** ${m.skill} • **Estimated Hours:** ${m.estimatedHours || "10-15 hrs"}\n`;
        text += `**Milestone Objective:** ${m.title}\n`;
        text += `- [ ] **Action:** ${m.action}\n`;
        text += `- [ ] **Portfolio Project:** ${m.projectIdea}\n\n`;
      });

      navigator.clipboard.writeText(text).then(() => {
        this.showToast("6-Week Roadmap copied to clipboard!", "success");
      }).catch(() => {
        this.showToast("Roadmap copied to clipboard!", "success");
      });
    }

    /* ==========================================================================
       Tailored Interview Questions Generator (Safe DOM Construction)
       ========================================================================== */
    renderFilteredQuestions() {
      if (!this.currentAnalysis) return;

      const category = this.activeQuestionCategory;
      const term = (this.interviewSearchTerm || "").toLowerCase();

      const list = (this.currentAnalysis.interviewQuestions || []).filter((q) => {
        const matchesCategory = category === "all" || q.category === category;
        const matchesSearch = !term ||
          (q.question && q.question.toLowerCase().includes(term)) ||
          (q.category && q.category.toLowerCase().includes(term)) ||
          (q.reason && q.reason.toLowerCase().includes(term)) ||
          (q.modelAnswer && q.modelAnswer.toLowerCase().includes(term));
        return matchesCategory && matchesSearch;
      });

      this.interviewQuestionsContainer.textContent = "";
      if (list.length === 0) {
        const emptyNote = document.createElement("p");
        emptyNote.style.fontSize = "0.875rem";
        emptyNote.style.color = "var(--text-muted)";
        emptyNote.style.textAlign = "center";
        emptyNote.style.padding = "2rem";
        emptyNote.textContent = "No questions match your filter criteria.";
        this.interviewQuestionsContainer.appendChild(emptyNote);
        return;
      }

      list.forEach((q) => {
        const card = document.createElement("div");
        card.className = "question-card";

        // Top meta row
        const topDiv = document.createElement("div");
        topDiv.className = "question-card-top";

        const metaGroup = document.createElement("div");
        metaGroup.className = "question-meta-group";

        const catBadge = document.createElement("span");
        catBadge.className = "badge badge-primary";
        catBadge.textContent = q.category || "Technical";

        const diffBadge = document.createElement("span");
        diffBadge.className = `badge ${q.difficulty === 'Skill Gap Question' ? 'badge-rose' : 'badge-emerald'}`;
        diffBadge.textContent = q.difficulty || "Core Competency";

        metaGroup.appendChild(catBadge);
        metaGroup.appendChild(diffBadge);

        const copyBtn = document.createElement("button");
        copyBtn.className = "btn btn-outline btn-sm copy-single-q-btn";
        copyBtn.setAttribute("data-qid", q.id);
        copyBtn.title = "Copy Question";
        copyBtn.innerHTML = `
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
          </svg>
          <span>Copy</span>
        `;

        topDiv.appendChild(metaGroup);
        topDiv.appendChild(copyBtn);
        card.appendChild(topDiv);

        // Question text
        const qHeading = document.createElement("h4");
        qHeading.className = "question-text";
        qHeading.textContent = q.question;
        card.appendChild(qHeading);

        // Reason text
        const qReason = document.createElement("p");
        qReason.className = "question-reason";
        qReason.textContent = q.reason;
        card.appendChild(qReason);

        // STAR talking points box
        const tpBox = document.createElement("div");
        tpBox.className = "talking-points-box";
        const tpHd = document.createElement("div");
        tpHd.className = "talking-points-heading";
        tpHd.textContent = "STAR Talking Points Guide";
        tpBox.appendChild(tpHd);

        const tpList = document.createElement("ul");
        tpList.className = "talking-points-list";
        (q.talkingPoints || []).forEach((pt) => {
          const li = document.createElement("li");
          li.textContent = pt;
          tpList.appendChild(li);
        });
        tpBox.appendChild(tpList);
        card.appendChild(tpBox);

        // Model answer accordion
        const accordion = document.createElement("div");
        accordion.className = "model-answer-accordion";

        const accBtn = document.createElement("button");
        accBtn.type = "button";
        accBtn.className = "accordion-toggle-btn";
        accBtn.setAttribute("data-target", `modelAns_${q.id}`);
        accBtn.innerHTML = `<span>Reveal Model Answer & Strategy</span><span class="accordion-arrow">▼</span>`;

        const accBody = document.createElement("div");
        accBody.className = `accordion-body ${this.allAnswersExpanded ? 'open' : ''}`;
        accBody.id = `modelAns_${q.id}`;

        const sampleLabel = document.createElement("p");
        const strong = document.createElement("strong");
        strong.textContent = "Sample Response:";
        sampleLabel.appendChild(strong);

        const ansText = document.createElement("p");
        ansText.style.marginTop = "0.25rem";
        ansText.textContent = `"${q.modelAnswer}"`;

        accBody.appendChild(sampleLabel);
        accBody.appendChild(ansText);
        accordion.appendChild(accBtn);
        accordion.appendChild(accBody);
        card.appendChild(accordion);

        // Notes section
        const notesWrap = document.createElement("div");
        notesWrap.className = "interview-notes-wrap";

        const notesLabel = document.createElement("label");
        notesLabel.style.fontSize = "0.75rem";
        notesLabel.style.fontWeight = "700";
        notesLabel.style.color = "var(--text-muted)";
        notesLabel.style.marginBottom = "0.35rem";
        notesLabel.style.display = "block";
        notesLabel.textContent = "Your Practice Talking Points / Notes:";

        const notesTextarea = document.createElement("textarea");
        notesTextarea.className = "notes-input";
        notesTextarea.placeholder = "Draft your personal STAR response points here...";
        notesTextarea.setAttribute("data-qid", q.id);
        notesTextarea.value = this.candidateNotes[q.id] || "";

        const notesActions = document.createElement("div");
        notesActions.className = "notes-actions";
        const saveNoteBtn = document.createElement("button");
        saveNoteBtn.type = "button";
        saveNoteBtn.className = "btn btn-secondary btn-sm save-note-btn";
        saveNoteBtn.setAttribute("data-qid", q.id);
        saveNoteBtn.textContent = "Save Notes";
        notesActions.appendChild(saveNoteBtn);

        notesWrap.appendChild(notesLabel);
        notesWrap.appendChild(notesTextarea);
        notesWrap.appendChild(notesActions);
        card.appendChild(notesWrap);

        this.interviewQuestionsContainer.appendChild(card);
      });

      // Bind dynamic accordion and copy listeners
      this.bindInterviewCardEvents();
    }

    bindInterviewCardEvents() {
      // Toggle individual model answer
      document.querySelectorAll(".accordion-toggle-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const targetId = e.currentTarget.getAttribute("data-target");
          const body = document.getElementById(targetId);
          if (body) {
            const isOpen = body.classList.toggle("open");
            const arrow = e.currentTarget.querySelector(".accordion-arrow");
            if (arrow) arrow.textContent = isOpen ? "▲" : "▼";
          }
        });
      });

      // Copy single question with complete context (talking points & model answer)
      document.querySelectorAll(".copy-single-q-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const qid = e.currentTarget.getAttribute("data-qid");
          const q = this.currentAnalysis.interviewQuestions.find((item) => item.id == qid);
          if (q) {
            let copyPayload = `Question: ${q.question}\nCategory: ${q.category} (${q.difficulty})\nWhy Asked: ${q.reason}\n`;
            if (q.talkingPoints && q.talkingPoints.length) {
              copyPayload += `\nSTAR Talking Points:\n` + q.talkingPoints.map((p) => `- ${p}`).join("\n") + "\n";
            }
            if (q.modelAnswer) {
              copyPayload += `\nExample Answer:\n"${q.modelAnswer}"\n`;
            }
            navigator.clipboard.writeText(copyPayload.trim());
            this.showToast("Question & answering guide copied to clipboard!", "success");
          }
        });
      });

      // Save Notes
      document.querySelectorAll(".save-note-btn").forEach((btn) => {
        btn.addEventListener("click", (e) => {
          const qid = e.currentTarget.getAttribute("data-qid");
          const textarea = document.querySelector(`.notes-input[data-qid="${qid}"]`);
          if (textarea) {
            this.candidateNotes[qid] = textarea.value;
            this.persistNotes();
            this.showToast("Practice notes saved locally!", "success", 1500);
          }
        });
      });
    }

    toggleAllAnswers() {
      this.allAnswersExpanded = !this.allAnswersExpanded;
      document.querySelectorAll(".accordion-body").forEach(body => {
        if (this.allAnswersExpanded) {
          body.classList.add("open");
        } else {
          body.classList.remove("open");
        }
      });
      document.querySelectorAll(".accordion-arrow").forEach(arr => {
        arr.textContent = this.allAnswersExpanded ? "▲" : "▼";
      });
      if (this.toggleAllAnswersBtn) {
        this.toggleAllAnswersBtn.textContent = this.allAnswersExpanded ? "Collapse All Answers" : "Expand All Answers";
      }
    }

    clearAllPracticeNotes() {
      this.candidateNotes = {};
      this.persistNotes();
      document.querySelectorAll(".notes-input").forEach(tx => tx.value = "");
      this.showToast("All practice notes cleared.", "info", 1800);
    }

    copyAllQuestions() {
      if (!this.currentAnalysis || !this.currentAnalysis.interviewQuestions.length) {
        this.showToast("No questions available to copy.", "error");
        return;
      }

      const text = this.currentAnalysis.interviewQuestions
        .map((q, idx) => `${idx + 1}. [${q.category} - ${q.difficulty}]\n${q.question}\nContext: ${q.reason}\n`)
        .join("\n");

      navigator.clipboard.writeText(text);
      this.showToast("All interview questions copied to clipboard!", "success");
    }

    loadSavedNotes() {
      try {
        const raw = localStorage.getItem("careerlens_interview_notes");
        if (raw) this.candidateNotes = JSON.parse(raw);
      } catch (e) {
        this.candidateNotes = {};
      }
    }

    persistNotes() {
      try {
        localStorage.setItem("careerlens_interview_notes", JSON.stringify(this.candidateNotes));
      } catch (e) {}
    }

    /* ==========================================================================
       Bullet Point Optimizer
       ========================================================================== */
    runBulletOptimizer() {
      const bullet = this.bulletInputText.value.trim();
      if (!bullet) {
        this.showToast("Please enter a bullet point to rewrite.", "error");
        return;
      }

      const role = this.currentAnalysis ? this.currentAnalysis.targetRole : "Software Engineer";
      const result = this.analyzer.optimizeBullet(bullet, role);

      if (!result) return;

      this.optimizerResults.innerHTML = "";

      result.versions.forEach((ver) => {
        const item = document.createElement("div");
        item.className = "optimized-version-item";
        item.innerHTML = `
          <div class="version-top-meta">
            <span class="version-formula-tag">${this.escapeHtml(ver.type)}</span>
            <span class="badge badge-primary" style="font-size:0.6875rem;">${ver.badge}</span>
          </div>
          <p class="version-text">"${this.escapeHtml(ver.text)}"</p>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="font-size:0.75rem; color:var(--text-muted); font-style:italic;">${this.escapeHtml(ver.formula)}</span>
            <button class="btn btn-secondary btn-sm copy-bullet-btn" style="padding:0.25rem 0.65rem;">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
              </svg>
              Copy
            </button>
          </div>
        `;

        const copyBtn = item.querySelector(".copy-bullet-btn");
        copyBtn.addEventListener("click", () => {
          navigator.clipboard.writeText(ver.text);
          this.showToast("Optimized bullet copied to clipboard!", "success");
        });

        this.optimizerResults.appendChild(item);
      });

      this.showToast("Generated 3 high-impact bullet formulas!", "success");
    }

    /* ==========================================================================
       Copy Match Summary
       ========================================================================== */
    copySummary() {
      if (!this.currentAnalysis) {
        this.showToast("Run an analysis first.", "error");
        return;
      }

      const d = this.currentAnalysis;
      const topMatched = d.skills.matched.slice(0, 5).map((s) => s.name).join(", ");
      const topMissing = d.skills.missing.slice(0, 5).map((s) => s.name).join(", ");

      const summary = `
CareerLens AI - Resume & Job Match Audit (Baseline Estimate)
Candidate: ${d.candidateName}
Target Role: ${d.targetRole}
Estimated Match Score: ${d.scores.overall}/100 (${d.scores.rating})

Scores Breakdown:
- Baseline Skill Match: ${d.scores.skills}% (${d.transparency.formulaExplanation})
- ATS Formatting & Readability: ${d.scores.ats}%
- Seniority & Experience: ${d.scores.experience}%
- Keyword Relevance: ${d.scores.keywords}%

Top Matched Skills: ${topMatched || "None"}
Top Missing Skills: ${topMissing || "None"}

Disclaimer: ${d.transparency.disclaimer}
Generated via CareerLens AI on ${d.timestamp}
      `.trim();

      navigator.clipboard.writeText(summary);
      this.showToast("Summary copied to clipboard!", "success");
    }

    /* ==========================================================================
       Download Analysis Reports (Markdown & JSON)
       ========================================================================== */
    downloadMarkdownReport() {
      if (!this.currentAnalysis) {
        this.showToast("Please run an analysis before downloading a report.", "error");
        return;
      }
      const data = this.currentAnalysis;
      const name = data.candidateName || "Candidate";
      const role = data.targetRole || "Target Position";
      const date = data.timestamp || new Date().toLocaleString();
      const engine = data.isAi !== false ? "Real AI Semantic Intelligence" : "Deterministic Heuristic Engine";

      let md = `# CareerLens AI — Resume & Job Match Analysis Report\n\n`;
      md += `| Attribute | Details |\n|---|---|\n`;
      md += `| **Candidate Name** | ${name} |\n`;
      md += `| **Target Role** | ${role} |\n`;
      md += `| **Analysis Date** | ${date} |\n`;
      md += `| **Evaluation Engine** | ${engine} |\n`;
      md += `| **Overall Match Score** | **${data.scores.overall} / 100** (${data.scores.rating}) |\n`;
      if (data.deterministicMetrics) {
        md += `| **Deterministic Keyword Overlap** | **${data.deterministicMetrics.deterministicScore}%** (${data.deterministicMetrics.matchedCount} of ${data.deterministicMetrics.totalSkillsCount} taxonomy keywords) |\n`;
      }
      md += `\n---\n\n`;

      md += `## 1. Executive Summary\n\n`;
      md += `**Verdict:** ${this.scoreVerdictNote ? this.scoreVerdictNote.textContent : "Match evaluated based on taxonomy and semantic depth."}\n\n`;
      md += `### Score Breakdown\n`;
      md += `- **Baseline / Keyword Match:** ${data.scores.skills}%\n`;
      md += `- **ATS Compliance & Readability:** ${data.scores.ats}%\n`;
      md += `- **Seniority & Experience Alignment:** ${data.scores.experience}%\n`;
      md += `- **Contextual Keyword Relevance:** ${data.scores.keywords}%\n\n`;

      if (data.deterministicMetrics?.categoryBreakdown?.length) {
        md += `### Domain Category Match Breakdown (Deterministic)\n\n`;
        md += `| Category | Matched / Required | Match Percentage |\n|---|---|---|\n`;
        data.deterministicMetrics.categoryBreakdown.forEach((c) => {
          md += `| ${c.category} | ${c.matchedCount} / ${c.totalCount} | ${c.percentage}% |\n`;
        });
        md += `\n`;
      }

      md += `## 2. Skill Competency Analysis\n\n`;
      md += `### Matched Skills (${data.skills.matched.length})\n`;
      if (data.skills.matched.length > 0) {
        data.skills.matched.forEach((s) => {
          md += `- **${s.name}** (${s.category || "General"})\n`;
        });
      } else {
        md += `_No taxonomy skills matched directly._\n`;
      }
      md += `\n### Missing / Desired Skills (${data.skills.missing.length})\n`;
      if (data.skills.missing.length > 0) {
        data.skills.missing.forEach((s) => {
          md += `- **${s.name}** (${s.category || "General"}) — _${s.importance || "Recommended"}_\n`;
        });
      } else {
        md += `_No critical skill gaps detected!_\n`;
      }
      md += `\n`;

      md += `## 3. Candidate Strengths & Identified Vulnerabilities\n\n`;
      md += `### Strengths\n`;
      (data.strengths || []).forEach((st) => {
        md += `- **${st.title}**: ${st.desc}\n`;
      });
      md += `\n### Critical Vulnerabilities & Gaps\n`;
      (data.weaknesses || []).forEach((w) => {
        md += `- **[Priority: ${w.priority || "Action"}] ${w.title}**: ${w.desc}\n`;
      });
      md += `\n`;

      md += `## 4. Actionable Optimization Recommendations\n\n`;
      (data.recommendations || []).forEach((r, idx) => {
        md += `### Step ${r.step || (idx + 1)}: ${r.title}\n`;
        md += `${r.action}\n\n`;
      });

      if (data.learningRoadmap?.length) {
        md += `## 5. Personalized 6-Week Skill-Gap Learning Roadmap\n\n`;
        data.learningRoadmap.forEach((m, idx) => {
          md += `### ${m.phase || `Phase ${idx + 1}`}: ${m.title}\n`;
          md += `- **Skill Focus:** ${m.skill}\n`;
          md += `- **Estimated Hours:** ${m.estimatedHours || "10-15 hrs"}\n`;
          md += `- **Learning Action:** ${m.action}\n`;
          md += `- **Portfolio Project Deliverable:** ${m.projectIdea}\n\n`;
        });
      }

      if (data.interviewQuestions?.length) {
        md += `## 6. Tailored Interview Preparation Questions\n\n`;
        data.interviewQuestions.forEach((q, idx) => {
          md += `### Question ${idx + 1} [${q.category}] — ${q.difficulty || "Core Competency"}\n`;
          md += `**Question:** "${q.question}"\n\n`;
          if (q.reason) md += `_Why this question is asked:_ ${q.reason}\n\n`;
          if (q.talkingPoints?.length) {
            md += `**Key Talking Points (STAR Framework):**\n`;
            q.talkingPoints.forEach((pt) => {
              md += `- ${pt}\n`;
            });
            md += `\n`;
          }
          if (q.modelAnswer) {
            md += `**Example Executive Answer:**\n> "${q.modelAnswer}"\n\n`;
          }
        });
      }

      md += `---\n_Report generated via CareerLens AI • Applicant Tracking System & Semantic Match Engine_\n`;

      // Trigger download
      const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
      const cleanName = (name.replace(/[^a-zA-Z0-9]/g, "_") || "Candidate").slice(0, 25);
      const cleanRole = (role.replace(/[^a-zA-Z0-9]/g, "_") || "Role").slice(0, 25);
      const fileName = `CareerLens_Analysis_${cleanName}_${cleanRole}.md`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      this.showToast(`Downloaded ${fileName}`, "success");
    }

    downloadJsonReport() {
      if (!this.currentAnalysis) {
        this.showToast("Please run an analysis before exporting JSON data.", "error");
        return;
      }
      const dataStr = JSON.stringify(this.currentAnalysis, null, 2);
      const blob = new Blob([dataStr], { type: "application/json;charset=utf-8" });
      const name = (this.currentAnalysis.candidateName || "Candidate").replace(/[^a-zA-Z0-9]/g, "_");
      const fileName = `CareerLens_Data_${name}.json`;

      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);

      this.showToast(`Exported ${fileName}`, "success");
    }

    /* ==========================================================================
       Toast Notifications
       ========================================================================== */
    showToast(message, type = "info", duration = 3000) {
      const toast = document.createElement("div");
      toast.className = `toast toast-${type}`;

      let icon = "ℹ";
      if (type === "success") icon = "✓";
      else if (type === "error") icon = "✕";

      toast.innerHTML = `
        <span style="font-weight:800; font-size:1.1rem;">${icon}</span>
        <span>${this.escapeHtml(message)}</span>
      `;

      this.toastContainer.appendChild(toast);

      setTimeout(() => {
        toast.style.animation = "fadeOutToast 0.3s forwards";
        setTimeout(() => toast.remove(), 350);
      }, duration);
    }

    escapeHtml(str) {
      if (!str) return "";
      return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }
  }

  // Bootstrap when DOM ready
  document.addEventListener("DOMContentLoaded", () => {
    window.CareerLensApp = new CareerLensApp();
  });
})();
