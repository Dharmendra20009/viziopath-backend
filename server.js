const mongoose = require("mongoose");
const app = require("./app");

const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || "development";

async function startServer() {
  try {
    if (process.env.MONGO_URI) {
      await mongoose.connect(process.env.MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      });
      console.log("✅ MongoDB connected");
    } else {
      console.log("⚠️ No DB connection string found, skipping DB...");
    }

    app.listen(PORT, () => {
      console.log(`🚀 Server running in ${NODE_ENV} mode on port ${PORT}`);
    });
  } catch (err) {
    console.error("❌ Failed to start server:", err.message);
    process.exit(1);
  }
}

startServer();

