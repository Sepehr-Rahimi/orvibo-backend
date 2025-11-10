import { Request, Response } from "express";

const paginationUtil = (req: Request, res: Response) => {
  let { page, limit = 10 } = req?.query; // Default values if not provided
  if (page) {
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    if (
      isNaN(pageNumber) ||
      isNaN(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1
    ) {
      res.status(400).json({ error: "Invalid page or limit parameters" });
      return;
    }

    const offset = (pageNumber - 1) * limitNumber; // Calculate offset

    return { limit: limitNumber, offset, page: pageNumber };
  } else return undefined;
};

export default paginationUtil;
