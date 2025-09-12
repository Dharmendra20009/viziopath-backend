const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const helmet = require("helmet");
const routes = require("./routes");
const ApiError = require("./utils/ApiError");
const errorHandler = require("./middlewares/errorHandler");

const app = express();

// Security headers
app.use(helmet());

// Parse JSON & cookies
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Handle invalid JSON payloads gracefully
app.use((err, req, res, next) => {
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({ message: "Invalid JSON payload" });
  }
  next();
});

// ✅ Allowed origins from env
const allowedOrigins = (process.env.CLIENT_ORIGIN || "").split(",");

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true); // allow server-to-server
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  })
);

// Health check
app.get("/health", (req, res) =>
  res.json({ status: "ok", service: "viziopath-backend" })
);

// API routes
app.use("/api", routes);

// 404 handler
app.use((req, res, next) => next(new ApiError(404, "Route not found")));

// Error handler
app.use(errorHandler);

module.exports = app;
