import type { Request, Response, NextFunction } from "express";
import { AppError } from "./error.middleware";
import { apiKeyService } from "../service/apikey.service";

declare global {
  namespace Express {
    interface Request {
      user?: {
        email: string;
        key: string;
      };
    }
  }
}

export const apiKeyMiddleware = (
  req: Request,
  _res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"] as string | string[] | undefined;

  if (!apiKey) {
    throw new AppError(401, "API key is required");
  }

  const key = Array.isArray(apiKey) ? apiKey[0] : apiKey;

  try {
    const validation = apiKeyService.validateApiKey(key);
    if (validation.isValid && validation.email) {
      req.user = { email: validation.email, key: key };
      next();
    } else {
      throw new AppError(401, "Invalid API key");
    }
  } catch (error) {
    throw new AppError(500, "Failed to verify API key");
  }
};
