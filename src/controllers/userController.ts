import { NextFunction, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { initModels } from "../models/init-models";
import { verifyPhone } from "../utils/verifyPhone";

const User = initModels().users;

const expiresIn = "1d";

export const signup = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, password, firstName, lastName, code } = req.body;

    if (!code) {
      res
        .status(422)
        .json({ success: false, message: "کد وارد شده صحیح نیست" });
    }

    // Check if phone number is already registered
    const existingUser = await User.findOne({
      where: { phone_number: phone },
    });
    if (existingUser) {
      res.status(400).json({ message: "شماره تلفن قبلا وجود دارد" });
      return;
    }

    const validatePhone = await verifyPhone(phone, code);
    if (!validatePhone?.success) {
      res.status(422).json(validatePhone);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user

    const newUser = await User.create({
      password: hashedPassword,
      phone_number: phone,
      first_name: firstName,
      last_name: lastName,
      status: 1,
    });

    const accessToken = jwt.sign(
      { id: newUser.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn,
      }
    );

    // Return a success response
    res.status(201).json({
      message: "ثبت نام با موفقیت انجام شد",
      user: { ...newUser.dataValues, accessToken },
    });
  } catch (err) {
    next(err); // Pass the error to error-handling middleware`
  }
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone, password } = req.body;

    // console.log(process.env.DB_PASSWORD);

    // Find the user by phone number
    const user = await User.findOne({ where: { phone_number: phone } });
    if (!user) {
      res.status(401).json({ message: "شماره موبایل یا رمز ورود اشتباه است" });
      return;
    }

    // Check if the password matches
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "شماره موبایل یا رمز ورود اشتباه است" });
      return;
    }

    // Generate a JWT token
    const accessToken = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET as string,
      {
        expiresIn,
      }
    );

    res.status(200).json({ message: "ورود با موفقیت انجام شد", accessToken });
  } catch (err) {
    next(err); // Pass the error to the error-handling middleware
  }
};

interface AuthenticatedRequest extends Request {
  user?: any;
}

export const getUserProfile = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "کاربری پیدا نشد" });
      return;
    }

    const user = req.user;

    // Return user data (exclude sensitive fields like password)
    const userData = {
      id: user.id,
      phone_number: user.phone_number,
      firstName: user.first_name,
      lastName: user.last_name,
      email: user.email,
      role: user.role,
      status: user.status,
    };

    res.status(200).json({ user: userData });
    return;
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
    return;
  }
};

export const updateUserProfile = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { firstName, lastName, email } = req.body;

    // Ensure the user is authenticated
    if (!req.user) {
      res.status(401).json({ message: "کاربری پیدا نشد" });
      return;
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      res.status(404).json({ error: "کاربری پیدا نشده" });
      return;
    }

    // Update user fields
    if (firstName !== undefined) user.first_name = firstName;
    if (lastName !== undefined) user.last_name = lastName;
    if (email !== undefined) user.email = email;

    await user.save();

    res.status(200).json({
      message: "اطلاعات کاربر با موفقیت ویرایش شد",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        phone_number: user.phone_number,
      },
    });
    return;
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const changePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Ensure the user is authenticated
    if (!req.user) {
      res.status(401).json({ error: "کاربری پیدا نشد" });
      return;
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      res.status(404).json({ error: "کاربری پیدا نشده" });
      return;
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "رمز ورود اشتباه است" });
      return;
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    if (newPassword !== undefined) user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      message: "رمز عبور با موفقیت ویرایش شد",
    });
    return;
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
export const resetPassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone_or_email, password } = req.body;

    // Ensure the user is authenticated
    const user = await User.findOne({
      where: {
        phone_number: phone_or_email,
      },
    });

    if (!user) {
      res.status(404).json({ message: "کاربری پیدا نشده" });
      return;
    }

    // Update user password
    const hashedPassword = await bcrypt.hash(password, 10);

    if (password !== undefined) user.password = hashedPassword;

    await user.save();

    res.status(200).json({
      message: "رمز عبور با موفقیت ویرایش شد",
    });
    return;
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const verifyUser = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { phone_or_email } = req.body;

    // Ensure the user is authenticated
    const user = await User.findOne({
      where: {
        phone_number: phone_or_email,
      },
    });

    if (!user) {
      res.status(404).json({ message: "کاربری پیدا نشده" });
      return;
    }

    // Update user status

    user.status = 1;

    await user.save();

    res.status(200).json({
      message: "شماره با موفقیت تایید شد",
    });
    return;
  } catch (error) {
    console.error("Error :", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const userList = async (req: Request, res: Response): Promise<void> => {
  try {
    // Fetch all users from the database
    const users = await User.findAll({
      where: {
        role: 1,
      },
      attributes: [
        "id",
        "phone_number",
        "first_name",
        "last_name",
        "email",
        "created_at",
        "status",
      ],
    });

    // Check if there are no user found
    if (users.length === 0) {
      res.status(200).json({ success: true, data: [] });
      return;
    }

    // Return the list of users in the response
    res.status(200).json({ success: true, data: users });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const verifyUserInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { phone } = req.body;
  if (!phone || phone.length < 10) {
    res.status(400).json({ success: false, message: "شماره موبایل صحیح نیست" });
    return;
  }

  try {
    const existingUser = await User.findOne({
      where: { phone_number: phone },
    });
    if (existingUser) {
      res
        .status(400)
        .json({ message: "شماره تلفن قبلا وجود دارد", success: false });
      return;
    }

    res
      .status(200)
      .json({ message: "لطفا شماره موبایل خود را تایید کنید", success: true });
  } catch (error) {
    console.log(error);
  }
};
