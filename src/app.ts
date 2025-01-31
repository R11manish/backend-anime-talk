import express from "express";
import serverless from "serverless-http";
import logger from "./utlis/logger";
import { errorHandler } from "./middleware/error.middleware";
import { apiKeyMiddleware } from "./middleware/auth.middleware";
import otpRoutes from "./routes/otp.routes";
require("dotenv").config();


const app = express();

app.use(express.json());

app.get("/health", (_req, res) => {
  logger.info("Health check successful");
  res.status(200).json({ status: "healthy" });
});

app.use("/otp", otpRoutes);
app.get("/verify", apiKeyMiddleware, (req, res) => {
  res.json({ valid: true, email: req.user?.email });
});

app.post("/chat", apiKeyMiddleware, (req, res) => {
  res.status(200).json({ status: "working" });
});

app.use(errorHandler);

export const handler = serverless(app);

if (process.env.NODE_ENV !== "production") {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
  });
}
