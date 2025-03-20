import express from "express";
import serverless from "serverless-http";
import logger from "./utlis/logger";
import { errorHandler } from "./middleware/error.middleware";
import { apiKeyMiddleware } from "./middleware/auth.middleware";
import otpRoutes from "./routes/otp.routes";
import chatRoutes from "./routes/chat.routes";
import charRoutes from "./routes/characters.routes";
import { CorsOptions } from "cors";
import cors from "cors";

require("dotenv").config();

const app = express();

const corsOptions: CorsOptions = {
  origin: "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
};

app.use(cors(corsOptions));

app.use(express.json());

app.get("/health", (_req, res) => {
  logger.info("Health check successful");
  res.status(200).json({ status: "healthy" });
});

app.use("/otp", otpRoutes);
app.get("/verify", apiKeyMiddleware, (req, res) => {
  res.json({ valid: true, email: req.user?.email });
});

app.use("/chat", apiKeyMiddleware, chatRoutes);
app.use("/characters", charRoutes);

app.get("/ad-settings", (_req, res) => {
  res.json({
    adUnitName: "testing",
    adFormat: "Banner",
    adUnitId: "ca-app-pub-8083231867045783/2264244837",
  });
});

app.use(errorHandler);

export const handler = serverless(app);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}
