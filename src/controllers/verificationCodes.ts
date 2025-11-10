import { Request, Response, NextFunction } from "express";
import { initModels } from "../models/init-models";
import { Op } from "sequelize";
import { generateCode } from "../utils/generateCode";
import { sendSmsVerificationCode } from "../utils/smsUtils";

const { users: User, verification_codes: VerificationCode } = initModels();
const CODE_EXPIRATION_TIME = 5 * 60 * 1000; // 5 minutes

export const sendVerificationCode = async (req: Request, res: Response) => {
  try {
    const { phone_or_email } = req.body;

    // const user = await User.findOne({
    //   where: { phone_number: phone_or_email },
    // });

    // if (!user) {
    //   res.status(404).json({ message: "کاربر پیدا نشد" });
    //   return;
    // }

    // Check if an unexpired code exists
    const existingCode = await VerificationCode.findOne({
      where: {
        phone_or_email,
        expires_at: { [Op.gt]: new Date() },
        is_used: false,
      },
      order: [["expires_at", "DESC"]],
    });

    if (existingCode) {
      const remainingTime = Math.floor(
        (new Date(existingCode.expires_at).getTime() - Date.now()) / 1000
      );

      res.status(406).json({
        message:
          "کد قبلی هنوز معتبر است. لطفا تا ارسال کد بعدی 5 دقیقه صبر کنید.",
        remaining_time: remainingTime,
      });
      return;
    }

    VerificationCode.destroy({
      where: {
        phone_or_email,
      },
    });

    // Generate and save the new verification code
    const code = generateCode();

    await sendSmsVerificationCode(phone_or_email, code);

    await VerificationCode.create({
      phone_or_email,
      code,
      expires_at: new Date(Date.now() + CODE_EXPIRATION_TIME),
      is_used: false,
    });

    // Send the code (simulate via console or integrate SMS/email service)
    // console.log(`Verification code sent to ${phone_or_email}: ${code}`);

    res.status(200).json({ message: `کد تایید ارسال شد` });
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

/**
 * Verify the code
 */
export const verifyCode = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { phone_or_email, code } = req.body;

    const user = await User.findOne({
      where: { phone_number: phone_or_email },
    });

    if (!user) {
      res.status(404).json({ message: "کاربر پیدا نشد" });
      return;
    }

    // Find a valid (unexpired and unused) code
    const validCode = await VerificationCode.findOne({
      where: {
        phone_or_email,
        code,
        expires_at: { [Op.gt]: new Date() },
        is_used: false,
      },
    });

    if (!validCode) {
      res.status(400).json({ message: "کد نامعتبر است یا منقضی شده است" });
      return;
    }

    // Mark code as used
    validCode.is_used = true;
    await validCode.save();

    next();
  } catch (error) {
    console.error("Error creating banner:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
