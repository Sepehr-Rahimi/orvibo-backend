import express from "express";
import dotenv from "dotenv";
import productRoutes from "./routes/productRoutes";
import userRoutes from "./routes/userRoutes";
import brandRoutes from "./routes/brandRoutes";
import adressesRoutes from "./routes/addressesRoutes";
import categoryRoutes from "./routes/categoryRoutes";
import orderRoutes from "./routes/orderRoutes";
import blogRoutes from "./routes/blogRoutes";
import discountCodesRoutes from "./routes/discountCodesRoutes";
import bannerRoutes from "./routes/bannerRoutes";
import verificationCodeRoutes from "./routes/verificaionCodeRoutes";
import recommendRouter from "./routes/recommendRoutes";
import currencyRouter from "./routes/currencyRoutes";
import bankAccountRouter from "./routes/bank_account";
import cors from "cors";
import path from "path";
import bodyParser from "body-parser";
import "./cron/verifyPaymenCron";
import "./cron/dailyDiscount";

dotenv.config();

const app: express.Application = express();

app.use(cors());

app.use(bodyParser.urlencoded({ extended: true })); // Parse URL-encoded bodies

app.use(bodyParser.json());

// app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
//   console.error(err.stack);
//   res.status(500).json({ error: err.message });
// });

app.use("/api/users", userRoutes);

app.use("/api/addresses", adressesRoutes);

app.use("/api/products", productRoutes);

app.use("/api/orders", orderRoutes);

app.use("/api/brands", brandRoutes);

app.use("/api/discount_codes", discountCodesRoutes);

app.use("/api/categories", categoryRoutes);

app.use("/api/blogs", blogRoutes);

app.use("/api/banners", bannerRoutes);

app.use("/api/verification_code", verificationCodeRoutes);

app.use("/api/recommend", recommendRouter);

app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.use("/api/currency", currencyRouter);

app.use("/api/bank_accounts", bankAccountRouter);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
