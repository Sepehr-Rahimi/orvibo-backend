import jwt from "jsonwebtoken";

export const generateToken = (userId: string) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || "default_secret", {
    expiresIn: process.env.JWT_EXPIRES_IN || "1d",
  });
};

export const verifyToken = (token: string) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET || "default_secret");
  } catch (err) {
    throw new Error("Invalid token");
  }
};
