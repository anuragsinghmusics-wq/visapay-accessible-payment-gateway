import { Request, Response, NextFunction } from "express";
import { ZodSchema, ZodError } from "zod";

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const issues = err.issues.map((issue) => ({
          field: issue.path.join("."),
          message: issue.message,
        }));
        res.status(400).json({
          success: false,
          error: {
            code: "VALIDATION_ERROR",
            message: "Request payload failed schema validation",
            details: issues,
          },
        });
        return;
      }
      next(err);
    }
  };
}

