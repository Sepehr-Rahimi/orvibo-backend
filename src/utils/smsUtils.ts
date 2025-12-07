import axios from "axios";

export const sendSmsVerificationCode = async (phone: string, code: string) => {
  try {
    axios.get("https://api.sms-webservice.com/api/V3/Send", {
      params: {
        apikey: process.env.SMS_SECRET,
        text: `کد احراز ایران ارویبو : ${code}`,
        sender: process.env.SMS_SENDER_PHONENUMBER,
        Recipients: phone,
      },
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const sendSmsSuccessOrder = async (
  phone: string,
  name: string,
  orderId: number,
  refId: number
) => {
  try {
    axios.get("https://api.sms-webservice.com/api/V3/Send", {
      params: {
        apikey: process.env.SMS_SECRET,
        text: `سلام ${name}\nمحصول مورد نظر خریداری شد و سفارشت درحال پیگیریه شماره سفارش:${orderId}\nشماره تراکنش : ${refId}\nایران ارویبو\niranorvibo.com`,
        sender: process.env.SMS_SENDER_PHONENUMBER,
        Recipients: phone,
      },
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};

export const sendFactorSmsOrder = async (
  phone: string,
  name: string,
  orderId: number
  // refId: number
) => {
  try {
    axios.get("https://api.sms-webservice.com/api/V3/Send", {
      params: {
        apikey: process.env.SMS_SECRET,
        text: `سلام ${name}\nعزیز فاکتور شما ثبت شد. شماره سفارش:${orderId}\nایران ارویبو\niranorvibo.com`,
        sender: process.env.SMS_SENDER_PHONENUMBER,
        Recipients: phone,
      },
    });
  } catch (error) {
    console.log(error);
    return error;
  }
};
