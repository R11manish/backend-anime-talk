import { Request, Response, NextFunction } from "express";
import logger from "../utlis/logger";
import { z } from "zod";

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const errorHandler = (
  err: Error | AppError | z.ZodError,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  if (err instanceof z.ZodError) {
    return res.status(400).json({
      status: "error",
      message: "Validation failed",
      errors: err.errors.map((error) => ({
        field: error.path.join("."),
        message: error.message,
      })),
    });
  }

  logger.error("Unhandled Error:", err);
  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
};
