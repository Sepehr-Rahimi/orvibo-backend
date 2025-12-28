import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error";
import {
  ValidationError,
  UniqueConstraintError,
  ForeignKeyConstraintError,
  DatabaseError,
} from "sequelize";

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction
) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      message: err.message,
    });
    return;
  }
  const error = err as any;

  const handler = sequelizeErrorHandlers.find((h) => error instanceof h.class);

  // console.log("handler error ", error?.parent?.constraint);
  // console.log("hendler : ", handler);

  if (handler) {
    res.status(handler.status).json(handler.message(error?.parent));
    return;
  }

  res.status(500).json({
    success: false,
    message: "خطای سرور",
  });
};

// Each entry maps a Sequelize error class to a response
const sequelizeErrorHandlers = [
  {
    class: ValidationError,
    status: 400,
    message: (err: ValidationError) => ({
      message: "اعتبارسنجی داده‌ها انجام نشد",
      errors: err.errors.map((e) => ({
        field: e.path,
        message: e.message,
      })),
    }),
  },
  {
    class: UniqueConstraintError,
    status: 409,
    message: (err: UniqueConstraintError) => ({
      message: err.fields
        ? `مقدار ${Object.keys(err.fields).join(", ")} تکراری است.`
        : "مقدار تکراری وجود دارد.",
    }),
  },
  {
    class: ForeignKeyConstraintError,
    status: 409,
    message: (err: { constraint: string }) => {
      switch (err.constraint) {
        case "orders_address_id_fkey":
          return {
            message:
              "این آدرس نمی‌تواند حذف شود زیرا توسط سفارش‌های موجود استفاده شده است.",
          };
        default:
          return {
            message:
              "این رکورد توسط داده‌های دیگر استفاده شده و نمی‌توان آن را تغییر یا حذف کرد.",
          };
      }
    },
  },
  {
    class: DatabaseError, // fallback for other DB errors
    status: 400,
    message: (err: DatabaseError) => ({
      message: "خطای پایگاه داده: لطفاً ورودی‌ها را بررسی کنید.",
    }),
  },
];
