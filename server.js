/**
 * CareerLens AI - Secure Local & Production Node.js Server
 * Serves the web application and proxies requests to the AI endpoint
 * ensuring all secret API keys remain strictly server-side.
 */

const http = require("http");
const fs = require("fs");
const path = require("path");
const { handleAnalyzeRequest, getAiStatus } = require("./api/analyze");

// Load .env file safely
function loadEnv() {
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    try {
      if (typeof process.loadEnvFile === "function") {
        process.loadEnvFile(envPath);
      } else {
        // Fallback parser for older environments
        const content = fs.readFileSync(envPath, "utf-8");
        content.split("\n").forEach((line) => {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) return;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx !== -1) {
            const key = trimmed.slice(0, eqIdx).trim();
            const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
            if (key && !process.env[key]) {
              process.env[key] = val;
            }
          }
        });
      }
    } catch (e) {
      console.warn("Notice: .env file found but could not be parsed automatically:", e.message);
    }
  }
}

loadEnv();

const PORT = parseInt(process.env.PORT, 10) || 3000;
const ROOT_DIR = path.resolve(__dirname);

// MIME types for static assets
const MIME_TYPES = {
  ".html": "text/html; charset=UTF-8",
  ".css": "text/css; charset=UTF-8",
  ".js": "application/javascript; charset=UTF-8",
  ".json": "application/json; charset=UTF-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=UTF-8"
};

// Send JSON response helper
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=UTF-8",
    "Cache-Control": "no-store, no-cache, must-revalidate",
    "X-Content-Type-Options": "nosniff"
  });
  res.end(JSON.stringify(data));
}

// Read body stream with byte size limit (1MB max to prevent memory exhaustion)
function readRequestBody(req, maxBytes = 1048576) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBytes) {
        req.destroy();
        const err = new Error("Request body too large. Maximum size is 1MB.");
        err.statusCode = 413;
        err.code = "PAYLOAD_TOO_LARGE";
        reject(err);
        return;
      }
      body += chunk.toString("utf-8");
    });

    req.on("end", () => {
      if (!body) {
        resolve({});
        return;
      }
      try {
        const parsed = JSON.parse(body);
        resolve(parsed);
      } catch (err) {
        const parseErr = new Error("Invalid JSON format in request body.");
        parseErr.statusCode = 400;
        parseErr.code = "INVALID_JSON";
        reject(parseErr);
      }
    });

    req.on("error", (err) => reject(err));
  });
}

// Serve static files with path traversal protection
function serveStaticFile(req, res, pathname) {
  let relativePath = pathname === "/" ? "/index.html" : pathname;
  // Prevent directory traversal
  const safePath = path.normalize(relativePath).replace(/^(\.\.[\/\\])+/, "");
  const filePath = path.join(ROOT_DIR, safePath);

  // Security check: ensure path stays within ROOT_DIR
  if (!filePath.startsWith(ROOT_DIR)) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  // Never serve .env or git files
  const baseName = path.basename(filePath);
  if (baseName.startsWith(".env") || baseName.startsWith(".git")) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("403 Forbidden");
    return;
  }

  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 Not Found");
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    res.writeHead(200, {
      "Content-Type": contentType,
      "Content-Length": stats.size,
      "X-Content-Type-Options": "nosniff"
    });

    const stream = fs.createReadStream(filePath);
    stream.pipe(res);
  });
}

// Create HTTP server
const server = http.createServer(async (req, res) => {
  // CORS & Security Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);
  const pathname = url.pathname;

  // 1. API: GET /api/status
  if (req.method === "GET" && pathname === "/api/status") {
    const status = getAiStatus();
    sendJson(res, 200, status);
    return;
  }

  // 2. API: POST /api/analyze
  if (req.method === "POST" && pathname === "/api/analyze") {
    try {
      const body = await readRequestBody(req);
      const result = await handleAnalyzeRequest(body);
      sendJson(res, 200, result);
    } catch (err) {
      const statusCode = err.statusCode || 500;
      sendJson(res, statusCode, {
        success: false,
        error: err.code || "SERVER_ERROR",
        message: err.message || "An unexpected error occurred during analysis.",
        fallbackAvailable: true
      });
    }
    return;
  }

  // 3. Fallback for undefined API endpoints
  if (pathname.startsWith("/api/")) {
    sendJson(res, 404, { error: "NOT_FOUND", message: `API endpoint ${pathname} not found.` });
    return;
  }

  // 4. Static Asset Serving
  if (req.method === "GET" || req.method === "HEAD") {
    serveStaticFile(req, res, pathname);
    return;
  }

  res.writeHead(405, { "Content-Type": "text/plain" });
  res.end("405 Method Not Allowed");
});

if (require.main === module) {
  server.listen(PORT, () => {
    const status = getAiStatus();
    console.log(`\n========================================================`);
    console.log(`  🚀 CareerLens AI Server Running at http://localhost:${PORT}`);
    console.log(`  🤖 AI Integration: ${status.statusNote}`);
    console.log(`  🛡️  Zero Secrets Client-Side: Server-Side Enforced`);
    console.log(`========================================================\n`);
  });
}

module.exports = server;
