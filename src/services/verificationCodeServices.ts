import { Op } from "sequelize";
import { initModels } from "../models/init-models";
import { generateCode } from "../utils/generateCode";
import { sendSmsVerificationCode } from "../utils/smsUtils";
import { AppError } from "../utils/error";

const VerificationCodes = initModels().verification_codes;
const Users = initModels().users;

const CODE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

interface verifyCodeRequest {
  phone_or_email: string;
  code: string;
}

export const sendVerificationCodeService = async (phone_or_email: string) => {
  // const user = await User.findOne({
  //   where: { phone_number: phone_or_email },
  // });

  // if (!user) {
  //   res.status(404).json({ message: "کاربر پیدا نشد" });
  //   return;
  // }

  // Check if an unexpired code exists
  const existingCode = await VerificationCodes.findOne({
    where: {
      phone_or_email,
      expires_at: { [Op.gt]: new Date() },
      is_used: false,
    },
    order: [["expires_at", "DESC"]],
  });

  if (existingCode) {
    // const remainingTime = Math.floor(
    //   (new Date(existingCode.expires_at).getTime() - Date.now()) / 1000
    // );

    throw new AppError(
      "کد قبلی هنوز معتبر است. لطفا تا ارسال کد بعدی 5 دقیقه صبر کنید.",
      406
    );
  }

  VerificationCodes.destroy({
    where: {
      phone_or_email,
    },
  });

  // Generate and save the new verification code
  const code = generateCode();

  await sendSmsVerificationCode(phone_or_email, code);

  await VerificationCodes.create({
    phone_or_email,
    code,
    expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME),
    is_used: false,
  });

  // Send the code (simulate via console or integrate SMS/email service)
  // console.log(`Verification code sent to ${phone_or_email}: ${code}`);
};

export const verifyCodeService = async (data: verifyCodeRequest) => {
  const { code, phone_or_email } = data;
  const user = await Users.findOne({
    where: { phone_number: phone_or_email },
  });

  if (!user) {
    throw new AppError("کاربر پیدا نشد", 404);
  }

  // Find a valid (unexpired and unused) code
  const validCode = await VerificationCodes.findOne({
    where: {
      phone_or_email,
      code,
      expires_at: { [Op.gt]: new Date() },
      is_used: false,
    },
  });

  if (!validCode) {
    throw new AppError("کد نامعتبر است یا منقضی شده");
  }

  // Mark code as used
  validCode.is_used = true;
  await validCode.save();
};
