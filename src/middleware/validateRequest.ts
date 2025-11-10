import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";

const validateRequest = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(", ");
      res.status(400).json({ message: `Validation error: ${errorMessage}` });
      return;
    }
    next();
  };
};

export default validateRequest;
