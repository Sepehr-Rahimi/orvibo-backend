import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import { initModels } from "../models/init-models";
import { UserRoles } from "../enums/userRolesEnum";

interface AuthenticatedRequest extends Request {
  user?: any; // Add user to the request object
}
const User = initModels().users;

export const authenticateToken = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    res.status(401).json({ message: "لطفا ابتدا وارد شوید!" });
    return;
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      id: string;
    };

    // Find user by ID from the token payload
    const user = await User.findByPk(decoded.id); // Assuming the token includes the user's ID
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Attach user to the request object
    req.user = user;

    next(); // Continue to the next middleware/route handler
  } catch (err) {
    res.status(401).json({ message: "Invalid token" });
    return;
  }
};

export const authorize = (acceptedRoles: UserRoles[]) => {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      res.status(401).json({ message: "Unauthenticated" });
      return;
    }
    if (acceptedRoles && !acceptedRoles.includes(req.user?.role)) {
      res.status(403).json({ message: "محدودیت در دسترسی" });
      return;
    }

    next();
  };
};
