import { initModels, usersAttributes } from "../models/init-models";
import { AppError } from "../utils/error";
import { verifyPhone } from "../utils/verifyPhone";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

interface SignupRequest {
  firstName: string;
  lastName: string;
  code: number;
  phone: string;
  password: string;
}

interface LoginRequest {
  phone: string;
  password: string;
}

interface UpdateRequest {
  firstName: string;
  lastName: string;
  email: string;
}

interface changePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

interface resetPasswordReques {
  phone_or_email: string;
  password: string;
}

const Users = initModels().users;

const expiresIn = "1d";

export const signupService = async (data: SignupRequest) => {
  const { phone, password, firstName, lastName, code } = data;

  if (!code) {
    throw new AppError("کد وارد شده صحیح نیست", 400);
  }

  // Check if phone number is already registered
  const existingUser = await Users.findOne({
    where: { phone_number: phone },
  });
  if (existingUser) {
    throw new AppError("کاربری با این شماره موبایل ثبت شده", 400);
  }

  const validatePhone = await verifyPhone(phone, code);
  if (!validatePhone?.success) {
    throw new AppError(
      validatePhone?.message ?? "کد نامعتبر است یا منقضی شده",
      422
    );
  }

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create a new user

  const newUser = await Users.create({
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

  return { ...newUser.dataValues, accessToken };
};

export const loginService = async (data: LoginRequest) => {
  const { phone, password } = data;

  const user = await Users.findOne({ where: { phone_number: phone } });
  if (!user) {
    throw new AppError("کاربری با این مشخصات یافت نشد", 404);
  }

  // Check if the password matches
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError("رمز ورود نادرست است", 401);
  }

  // Generate a JWT token
  const accessToken = jwt.sign(
    { id: user.id },
    process.env.JWT_SECRET as string,
    {
      expiresIn,
    }
  );
  return accessToken;
};

export const getUserProfileService = async (user: usersAttributes) => {
  if (!user) {
    throw new AppError("کاربری یافت نشد", 400);
  }

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

  return userData;
};

export const updateUserService = async (
  userRequest: usersAttributes,
  data: UpdateRequest
) => {
  const { firstName, lastName, email } = data;

  // Ensure the user is authenticated
  if (!userRequest) {
    throw new AppError("کاربری یافت نشد", 400);
  }

  const user = await Users.findByPk(userRequest.id);

  if (!user) {
    throw new AppError("کاربری با این مشخصات یافت نشد", 404);
  }

  // Update user fields
  if (firstName !== undefined) user.first_name = firstName;
  if (lastName !== undefined) user.last_name = lastName;
  if (email !== undefined) user.email = email;

  await user.save();

  return user;
};

export const changePasswordService = async (
  userRequest: usersAttributes,
  data: changePasswordRequest
) => {
  const { currentPassword, newPassword } = data;
  // Ensure the user is authenticated
  if (!userRequest) {
    throw new AppError("کاربری یافت نشد", 400);
  }

  const user = await Users.findByPk(userRequest.id);

  if (!user) {
    throw new AppError("کاربری یافت نشد", 400);
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) {
    throw new AppError("رمز ورود اشتباه است", 401);
  }

  // Update user password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  if (newPassword !== undefined) user.password = hashedPassword;

  await user.save();
};

export const resetPasswordService = async (data: resetPasswordReques) => {
  const { phone_or_email, password } = data;

  // Ensure the user is authenticated
  const user = await Users.findOne({
    where: {
      phone_number: phone_or_email,
    },
  });

  if (!user) {
    throw new AppError("کاربری یافت نشد", 400);
  }

  // Update user password
  const hashedPassword = await bcrypt.hash(password, 10);

  if (password !== undefined) user.password = hashedPassword;

  await user.save();
};

export const verifyUserService = async (data: { phone_or_email: string }) => {
  const { phone_or_email } = data;
  // Ensure the user is authenticated
  const user = await Users.findOne({
    where: {
      phone_number: phone_or_email,
    },
  });

  if (!user) {
    throw new AppError("کاربر پیدا نشد", 404);
  }

  // Update user status

  user.status = 1;

  await user.save();
};

export const userListService = async () => {
  // Fetch all users from the database
  const users = await Users.findAll({
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
    return [];
  }
  return users;
};

export const verifyUserInfoService = async (phone: string) => {
  if (!phone || phone.length < 10) {
    throw new AppError("شماره موبایل صحیح نیست", 400);
  }

  const existingUser = await Users.findOne({
    where: { phone_number: phone },
  });
  if (existingUser) {
    throw new AppError("شماره موبایل ثبت شده است", 400);
  }

  return existingUser;
};
