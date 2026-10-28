/**
 * CareerLens AI - Integration and Verification Test Suite
 * Tests server startup, validation errors, schema conformance,
 * AI service status, and live LLM integration when credentials exist.
 */

const http = require("http");
const path = require("path");
const { validateInputs, sanitizeModelOutput, getAiStatus } = require("./api/analyze");
const server = require("./server");

const TEST_PORT = 3199;

function request(options, postData = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, headers: res.headers, data: json });
        } catch (_) {
          resolve({ status: res.statusCode, headers: res.headers, data: body });
        }
      });
    });
    req.on("error", reject);
    if (postData) {
      req.write(typeof postData === "string" ? postData : JSON.stringify(postData));
    }
    req.end();
  });
}

async function runTests() {
  console.log("==================================================");
  console.log("🧪 Starting CareerLens AI Integration Test Suite");
  console.log("==================================================");

  let passed = 0;
  let failed = 0;

  function assert(condition, testName) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Test Input Validation Logic
  console.log("\n[1] Testing Input Validation & Bounds Enforcement...");
  
  const emptyRes = validateInputs("", "Some valid job text with enough words to pass the minimum requirement easily");
  assert(!emptyRes.valid && emptyRes.error === "VALIDATION_EMPTY_RESUME", "Rejects empty resume input");

  const emptyJob = validateInputs("Some valid resume text with enough words to pass the minimum requirement easily", "");
  assert(!emptyJob.valid && emptyJob.error === "VALIDATION_EMPTY_JOB", "Rejects empty job description");

  const shortResume = validateInputs("Too short resume", "Valid job description with plenty of technical requirements and words to qualify");
  assert(!shortResume.valid && shortResume.error === "VALIDATION_RESUME_TOO_SHORT", "Rejects resume with fewer than 15 words");

  const oversizedResume = "word ".repeat(15000); // ~75,000 chars
  const overRes = validateInputs(
    oversizedResume,
    "Valid job description with plenty of technical requirements, software engineering duties, and words to qualify for screening."
  );
  assert(!overRes.valid && overRes.error === "VALIDATION_RESUME_TOO_LARGE", "Rejects oversized resume exceeding 50,000 characters");

  const validRes = validateInputs(
    "Senior Full-Stack Developer with 7 years experience in Node.js, React, TypeScript, PostgreSQL, and AWS building cloud systems.",
    "Looking for a Senior Full-Stack Engineer proficient in TypeScript, React, Node.js, and cloud native architectures with Docker and AWS."
  );
  assert(validRes.valid === true, "Accepts properly sized and formatted inputs");

  // 2. Test Output Sanitizer & Schema Normalization
  console.log("\n[2] Testing Model Output Sanitization & Schema Conformance...");
  const mockAiOutput = {
    matchScore: 85,
    candidateName: "Jordan Hayes",
    targetRole: "Staff Software Engineer",
    matchedSkills: [
      { name: "Node.js", category: "Backend", context: "Built high-throughput payment microservices" },
      { name: "TypeScript", category: "Languages", context: "Migrated frontend codebase to strict TS" }
    ],
    missingSkills: [
      { name: "Kubernetes", category: "Cloud & DevOps", importance: "Crucial" }
    ],
    strengths: [
      { title: "Deep Node.js Architecture", desc: "Demonstrated 5+ years of microservices design" }
    ],
    weaknesses: [
      { title: "Container Orchestration Gap", desc: "No direct mentions of K8s in production", priority: "High" }
    ],
    recommendations: [
      { step: 1, title: "Highlight Docker & Containerization", action: "Detail container deployment workflows" }
    ],
    learningRoadmap: [
      {
        step: 1,
        skill: "Kubernetes",
        phase: "Phase 1: Foundations (Week 1-2)",
        title: "Master Kubernetes Pod Lifecycle",
        action: "Deploy local Minikube cluster with manifests",
        projectIdea: "Deploy multi-service Helm chart",
        estimatedHours: "10 hrs"
      }
    ],
    interviewQuestions: [
      {
        id: "q_1",
        category: "Technical",
        difficulty: "Core Architecture",
        question: "How do you handle event-loop blockage in asynchronous Node.js microservices?",
        reason: "Validates high-volume backend scaling experience",
        talkingPoints: ["Situation", "Action", "Result"],
        modelAnswer: "I profile bottlenecks with Clinic.js and offload CPU-bound calculations."
      },
      {
        id: "q_2",
        category: "HR / Culture",
        difficulty: "Behavioral (STAR)",
        question: "Tell me about a time you handled disagreement over technical debt.",
        reason: "Tests team alignment",
        talkingPoints: ["Context", "Trade-off", "Consensus"],
        modelAnswer: "I quantify tech debt in terms of delivery risk and velocity."
      },
      {
        id: "q_3",
        category: "Resume-Specific",
        difficulty: "Experience Deep-Dive",
        question: "In your resume, you noted scaling to 10M requests. How did you handle cache invalidation?",
        reason: "Verifies personal ownership",
        talkingPoints: ["Architecture", "Cache stampede", "Metrics"],
        modelAnswer: "We used Redis with TTL jitter and probabilistic early expiration."
      }
    ]
  };

  const sanitized = sanitizeModelOutput(mockAiOutput);
  assert(sanitized.matchScore === 85, "Preserves valid matchScore (85)");
  assert(sanitized.scores.overall === 85, "Sets overall score");
  assert(sanitized.scores.rating === "Exceptional Match", "Calculates rating badge");
  assert(sanitized.skills.matched.length === 2, "Normalizes matched skills");
  assert(sanitized.skills.missing.length === 1, "Normalizes missing skills");
  assert(sanitized.strengths.length === 1, "Normalizes strengths");
  assert(sanitized.weaknesses.length === 1, "Normalizes weaknesses");
  assert(sanitized.recommendations.length === 1, "Normalizes recommendations");
  assert(sanitized.learningRoadmap.length === 1, "Normalizes learning roadmap");
  assert(sanitized.learningRoadmap[0].phase.includes("Phase 1"), "Roadmap includes phase structure");
  assert(sanitized.learningRoadmap[0].projectIdea.length > 5, "Roadmap includes practical project deliverable");
  assert(sanitized.interviewQuestions.length === 3, "Normalizes interview questions");
  assert(sanitized.interviewQuestions[0].category === "Technical", "Maps Technical interview question");
  assert(sanitized.interviewQuestions[1].category === "HR / Culture", "Maps HR / Culture interview question");
  assert(sanitized.interviewQuestions[2].category === "Resume-Specific", "Maps Resume-Specific interview question");
  assert(sanitized.deterministicMetrics.categoryBreakdown.length > 0, "Computes deterministic category breakdown");
  assert(sanitized.deterministicMetrics.deterministicScore === 67, "Computes exact deterministic score (2/3 = 67%)");

  // Client-Side Analyzer Verification
  const fs = require("fs");
  const analyzerCode = fs.readFileSync(path.join(__dirname, "js", "analyzer.js"), "utf8");
  // Evaluate in local sandbox
  const sandbox = {};
  const runCode = new Function("window", analyzerCode);
  runCode(sandbox);
  const clientAnalyzer = new sandbox.CareerLensAnalyzer();
  const clientResult = clientAnalyzer.analyze(
    "Senior Software Engineer with 6 years experience in JavaScript, TypeScript, React, Node.js and AWS. Architected payments pipeline reducing latency by 45%.",
    "Looking for a Senior Full-Stack Engineer with React, Node.js, AWS, Docker and Kubernetes."
  );
  assert(clientResult.learningRoadmap.length === 3, "Client baseline produces 3-phase learning roadmap");
  assert(clientResult.interviewQuestions.some(q => q.category === "Technical"), "Client baseline generates Technical questions");
  assert(clientResult.interviewQuestions.some(q => q.category === "HR / Culture"), "Client baseline generates HR / Culture questions");
  assert(clientResult.interviewQuestions.some(q => q.category === "Resume-Specific"), "Client baseline generates Resume-Specific questions");
  assert(clientResult.deterministicMetrics.categoryBreakdown.length > 0, "Client baseline computes domain category breakdown");

  // 3. Test HTTP Server Startup & Endpoints
  console.log("\n[3] Testing HTTP Server Endpoints on Port " + TEST_PORT + "...");
  await new Promise((resolve) => server.listen(TEST_PORT, resolve));

  try {
    // Test GET /api/status
    const statusRes = await request({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/api/status",
      method: "GET"
    });
    assert(statusRes.status === 200, "GET /api/status returns HTTP 200");
    assert(typeof statusRes.data.aiConfigured === "boolean", "GET /api/status returns aiConfigured boolean");
    console.log(`      AI Status: ${statusRes.data.statusNote}`);

    // Test GET / (static file serving)
    const indexRes = await request({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/",
      method: "GET"
    });
    assert(indexRes.status === 200, "GET / serves index.html (HTTP 200)");
    assert(typeof indexRes.data === "string" && indexRes.data.includes("CareerLens AI"), "index.html contains app title");

    // Test Path Traversal Protection
    const secretRes = await request({
      hostname: "localhost",
      port: TEST_PORT,
      path: "/.env",
      method: "GET"
    });
    assert(secretRes.status === 403, "GET /.env is blocked (HTTP 403 Forbidden)");

    // Test POST /api/analyze validation failure
    const invalidPost = await request(
      {
        hostname: "localhost",
        port: TEST_PORT,
        path: "/api/analyze",
        method: "POST",
        headers: { "Content-Type": "application/json" }
      },
      { resumeText: "short", jobText: "short" }
    );
    assert(invalidPost.status === 400, "POST /api/analyze returns HTTP 400 on invalid input");
    assert(invalidPost.data.error.startsWith("VALIDATION_"), "Returns structured validation error");

    // Test POST /api/analyze when AI key is missing or present
    const aiStatus = getAiStatus();
    if (!aiStatus.aiConfigured) {
      console.log("\n[4] External AI Credentials not set in environment (testing unconfigured fallback contract)...");
      const unconfiguredPost = await request(
        {
          hostname: "localhost",
          port: TEST_PORT,
          path: "/api/analyze",
          method: "POST",
          headers: { "Content-Type": "application/json" }
        },
        {
          resumeText: "Experienced Software Engineer with 6 years building web apps using JavaScript, React, Node.js, and SQL databases.",
          jobText: "Seeking a Full-Stack Engineer with React, Node.js, PostgreSQL, and cloud deployment experience for our platform."
        }
      );
      assert(unconfiguredPost.status === 503, "Returns HTTP 503 Service Unavailable when AI is not configured");
      assert(unconfiguredPost.data.fallbackAvailable === true, "Signals fallbackAvailable=true so client runs baseline engine");
    } else {
      console.log(`\n[4] Live AI Integration Test using ${aiStatus.provider.toUpperCase()} (${aiStatus.model})...`);
      const livePost = await request(
        {
          hostname: "localhost",
          port: TEST_PORT,
          path: "/api/analyze",
          method: "POST",
          headers: { "Content-Type": "application/json" }
        },
        {
          resumeText: "Senior Full-Stack Engineer with 8 years of experience in TypeScript, React, Next.js, Node.js, PostgreSQL, and AWS. Proven track record optimizing high-scale applications.",
          jobText: "We are hiring a Lead Full-Stack Engineer proficient in TypeScript, React, Node.js, Docker, Kubernetes, and AWS microservices architectures."
        }
      );
      assert(livePost.status === 200, "Live AI request returns HTTP 200");
      assert(livePost.data.success === true, "Live response has success=true");
      assert(typeof livePost.data.data.matchScore === "number", "Live response has valid matchScore number");
      assert(Array.isArray(livePost.data.data.skills.matched), "Live response has matched skills array");
      assert(Array.isArray(livePost.data.data.skills.missing), "Live response has missing skills array");
      assert(Array.isArray(livePost.data.data.strengths), "Live response has strengths array");
      assert(Array.isArray(livePost.data.data.weaknesses), "Live response has weaknesses array");
      assert(Array.isArray(livePost.data.data.recommendations), "Live response has recommendations array");
      assert(Array.isArray(livePost.data.data.interviewQuestions), "Live response has interviewQuestions array");
    }
  } finally {
    server.close();
  }

  console.log("\n==================================================");
  console.log(`Results: ${passed} Passed, ${failed} Failed`);
  console.log("==================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

if (require.main === module) {
  runTests().catch((err) => {
    console.error("Test execution failed:", err);
    process.exit(1);
  });
}
