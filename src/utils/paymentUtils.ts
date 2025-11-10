import axios from "axios";
import { initModels } from "../models/init-models";

// export const paymentUrl = "https://sandbox.zarinpal.com/";
export const paymentUrl = "https://payment.zarinpal.com/";

const currency = "IRT";

interface RequestPaymentProps {
  amount: Number;
  description: string;
  callback_url: string;
  mobile: string;
  email?: string;
  order_id: string;
}

interface RequestVerifyProps {
  authority: string;
  amount: number;
}

export const RequestPayment = async (props: RequestPaymentProps) => {
  const { amount, callback_url, description, mobile, order_id, email } = props;

  try {
    const res = await axios.post(
      `${paymentUrl}pg/v4/payment/request.json`,
      {
        merchant_id: process.env.PAYMENT_MERCHANT_ID,
        amount,
        callback_url,
        description,
        currency,
        mobile,
        order_id,
        email,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return res.data;
  } catch (error: any) {
    console.log(error);
    return error?.response?.data?.errors;
  }
};

export const RequestVerifyPayment = async (props: RequestVerifyProps) => {
  const { authority, amount } = props;

  try {
    const res = await axios.post(
      `${paymentUrl}pg/v4/payment/verify.json`,
      {
        merchant_id: process.env.PAYMENT_MERCHANT_ID,
        authority,
        amount,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
      }
    );

    return res.data;
  } catch (error: any) {
    console.log("inja", error?.response?.data?.errors);
    return error?.response?.data?.errors;
  }
};

export const zarinpalErrorMessages: { [key: string]: string } = {
  "-9": "اطلاعات ارسال‌شده معتبر نیست.",
  "-10": "درگاه پرداخت در حال حاضر در دسترس نیست.",
  "-11": "درگاه پرداخت فعال نیست.",
  "-12": "تعداد دفعات تلاش بیش از حد مجاز است. لطفاً بعداً تلاش کنید.",
  "-15": "درگاه پرداخت به حالت تعلیق درآمده است.",
  "-16": "درگاه پرداخت فعال نیست. لطفاً بعداً تلاش کنید.",
  "-17": "درگاه پرداخت غیرفعال شده است.",
  "-18": "دامنه درخواست با دامنه ثبت‌شده مطابقت ندارد.",
  "-19": "درگاه پرداخت موقتاً غیرفعال شده است.",

  "-30": "امکان استفاده از تسویه اشتراکی وجود ندارد.",
  "-31": "امکان انجام پرداخت با اطلاعات واردشده وجود ندارد.",
  "-32": "مبلغ واردشده بیشتر از مبلغ کل تراکنش است.",
  "-33": "درصدهای واردشده صحیح نیستند.",
  "-34": "سهم پرداخت شده بیش از حد مجاز است.",
  "-35": "تعداد افراد سهم‌بر بیش از حد مجاز است.",
  "-36": "حداقل مبلغ جهت تسهیم باید ۱۰۰۰ تومان باشد.",
  "-37": "شماره شبای وارد شده فعال نیست.",
  "-38": "خطا در شبا. لطفاً بعداً تلاش کنید.",
  "-39": "خطای داخلی. لطفاً بعداً تلاش کنید.",
  "-40": "اطلاعات اضافی ارسال شده معتبر نیست.",
  "-41": "حداکثر مبلغ مجاز پرداخت ۱۰۰ میلیون تومان است.",

  "-50": "مبلغ پرداخت شده با مبلغ درخواستی مطابقت ندارد.",
  "-51": "پرداخت ناموفق بوده است.",
  "-52": "مشکلی در پرداخت رخ داده است. لطفاً بعداً تلاش کنید.",
  "-53": "این پرداخت معتبر نیست.",
  "-54": "کد پیگیری نامعتبر است.",
  "-55": "تراکنش یافت نشد.",

  "-60": "امکان بازگشت وجه وجود ندارد.",
  "-61": "امکان بازگشت وجه فقط برای تراکنش‌های موفق وجود دارد.",
  "-62": "امکان انجام این عملیات وجود ندارد.",
  "-63": "مهلت بازگشت وجه به پایان رسیده است.",

  "100": "پرداخت با موفقیت انجام شد.",
  "101": "پرداخت قبلاً انجام شده است.",
};
