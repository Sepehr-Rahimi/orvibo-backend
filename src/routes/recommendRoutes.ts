import { Router } from "express";
import { getEmbedding } from "../utils/embeddingUtil";

const router = Router();

router.post("/", async (req, res) => {
  try {
    if (!req.body.text) {
      res.status(403).json({ message: "please enter the input" });
      return;
    }
    const resault = await getEmbedding(req.body?.text);

    res.status(200).json({ resault, success: true });
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: error, resault: [] });
  }
});

export default router;
