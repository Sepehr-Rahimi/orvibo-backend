import cron from "node-cron";
import { initModels, order_items, orders } from "../models/init-models";
import { RequestVerifyPayment } from "../utils/paymentUtils";
import dayjs from "dayjs";
import { Op } from "sequelize";
import { sendSmsSuccessOrder } from "../utils/smsUtils";

interface OrderWithItems extends orders {
  order_items?: order_items[];
}

// const Order = initModels().orders;
// const Product = initModels().products;
// const orderItems = initModels().order_items;
// const verification_codes = initModels().verification_codes;
// const users = initModels().users;
const {
  orders: Order,
  products: Product,
  order_items: orderItems,
  verification_codes,
  addresses,
  users,
} = initModels();

cron.schedule("*/30 * * * *", async () => {
  console.log(" Running order verification job...");

  const thirtyMinutesAgo = dayjs().subtract(30, "minute").toDate();

  const pendingOrders: OrderWithItems[] = await Order.findAll({
    where: {
      payment_status: 0,
      type_of_payment: "1",
      created_at: { [Op.lt]: thirtyMinutesAgo },
    },
    include: [orderItems],
  });

  //   where: { created_at: { [Op.lt]: thirtyDaysAgo } },

  for (const order of pendingOrders) {
    const transaction = await Order.sequelize?.transaction();

    try {
      const amount = order.total_cost;
      const paymentStatus = await RequestVerifyPayment({
        authority: order.payment_authority,
        amount,
      });

      const paymentResult = paymentStatus.data || paymentStatus;
      if (paymentResult?.code === 100 || paymentResult?.code === 101) {
        const items = order.order_items || [];
        for (const item of items) {
          const product = await Product.findByPk(item.product_id, {
            transaction,
          });
          if (!product) continue;
          // reduce product stock
          const newStock = Math.max(product?.stock - item.quantity, 0);
          await product.update({ stock: newStock }, { transaction });
        }
        // const user = await users.findByPk(order.user_id, { transaction });
        const address = await addresses.findByPk(order.address_id, {
          transaction,
        });
        if (address && address.full_name && paymentResult?.code === 100) {
          await sendSmsSuccessOrder(
            address.phone_number,
            address.full_name,
            order.id,
            paymentResult.ref_id
          );
        }
        await order.update({ payment_status: 1 }, { transaction });
        console.log(` Order ${order.id} marked as paid.`);
      } else if (
        paymentResult.code == -54 ||
        paymentResult.code == -55 ||
        paymentResult.code == -61 ||
        paymentResult.code == -10
      ) {
        //   const items = order.order_items || [];
        //   for (const item of items) {
        //     await Product.increment(
        //       { stock: item.quantity },
        //       { where: { id: item.product_id } }
        //     );
        //   }
        // await order.destroy();
        console.log(order);
        console.log(` Order ${order.id} canceled and stock restored.`);
      }
      await transaction?.commit();
    } catch (err) {
      console.error(`Error processing order ${order.id}:`, err);
      await transaction?.rollback();
    }
  }

  const verifyCodeExpiers = await verification_codes.findAll({
    where: {
      expires_at: { [Op.lt]: new Date() }, // expired codes
    },
  });

  await Promise.all(
    verifyCodeExpiers.map(async (code) => {
      await code.destroy();
      console.log(`code for number ${code.phone_or_email} is destoryed`);
    })
  );
});
