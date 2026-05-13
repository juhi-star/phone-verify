const express = require("express");
const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const authRoutes = require("./routes/auth");
const verificationRoutes = require("./routes/verification");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const logger = require("./utils/logger");

const app = express();

app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? process.env.ALLOWED_ORIGINS?.split(",") || []
    : "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

app.use(express.json({ limit: "10kb" }));

app.use(morgan("combined", {
  stream: { write: (message) => logger.http(message.trim()) },
  skip: () => process.env.NODE_ENV === "test",
}));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "Server is running", timestamp: new Date() });
});

const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: { success: false, message: "Too many requests from this IP. Please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/verify", verificationRoutes);

app.all("/api/*", (req, res) => {
  res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
});

app.get("*", (req, res) => {
  res.status(200).send(`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>PhoneVerify</title><style>body{background:#0a0a0f;color:#f0f0f8;font-family:'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;text-align:center;line-height:1.6}.card{background:#111118;border:1px solid #2a2a3a;border-radius:20px;padding:48px 40px;max-width:440px;box-shadow:0 0 80px rgba(108,99,255,0.25)}h1{font-size:26px;margin-bottom:8px;background:linear-gradient(90deg,#f0f0f8,#6c63ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}p{color:#7070a0;font-size:14px;margin-bottom:12px}.badge{display:inline-block;background:rgba(108,99,255,0.15);color:#6c63ff;padding:4px 12px;border-radius:6px;font-size:12px;font-weight:600;margin-bottom:16px}code{background:#1a1a24;padding:8px 14px;border-radius:8px;font-size:13px;color:#6c63ff;display:inline-block}.url{font-size:16px;font-weight:700;color:#6c63ff}</style></head><body><div class="card"><div class="badge">API Server Running</div><h1>Backend API Only</h1><p style="margin-bottom:20px">Frontend runs on <span class="url">http://localhost:5173</span></p><p style="font-size:12px;color:#505080">Run <code style="font-size:11px">npm run dev</code> from project root to start both</p></div></body></html>`);
});

app.use(notFound);
app.use(errorHandler);

module.exports = app;
