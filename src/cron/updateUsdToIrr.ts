import cron from "node-cron";
import { initModels } from "../models/init-models";
import axios from "axios";

type Exchange = {
  date: string;
  time: string;
  time_unix: number;
  symbol: string;
  name_en: string;
  name: string;
  price: number;
  change_value: number;
  change_percent: number;
  unit: string;
};

const variables = initModels().variables;

const link = `https://BrsApi.ir/Api/Market/Gold_Currency.php`;

cron.schedule("*/3 * * * * ", async () => {
  try {
    const dollarToIrrRecord = await variables.findOne({
      where: { name: "usdToIrr" },
    });

    if (!dollarToIrrRecord) {
      console.log("can't find the variable");
      return;
    }

    const res = await axios.get(link, {
      params: { key: `${process.env.BONBAST_API_KEY}` },
    });
    if (res.status !== 200) return;
    const marketData = res.data;
    const dollarExchange = marketData?.currency?.find(
      (singleCurerncy: Exchange) => singleCurerncy?.symbol == "USD"
    );

    if (!dollarExchange || !dollarExchange?.price) {
      console.log("dollar exchange is not find");
      return;
    }

    await dollarToIrrRecord?.update({ value: dollarExchange?.price });

    console.log("usd to irr exchange successfully updated");
  } catch (error) {
    console.log(error);
  }
});
