import { Op } from "sequelize";
import { initModels } from "../models/init-models";

const VerificationCode = initModels().verification_codes;

export const verifyPhone = async (phone: number, code: number) => {
  const validCode = await VerificationCode.findOne({
    where: {
      phone_or_email: phone,
      code,
      expires_at: { [Op.gt]: new Date() },
      is_used: false,
    },
  });

  if (!validCode) {
    return { message: "کد نامعتبر است یا منقضی شده است", success: false };
  }

  // Mark code as used
  validCode.is_used = true;
  await validCode.save();

  return { success: true };
};
