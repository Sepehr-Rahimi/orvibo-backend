import { AppError } from "./error";

const paginationUtil = (params: { page?: string; limit?: string }) => {
  let { page, limit = 10 } = params; // Default values if not provided
  if (page) {
    const pageNumber = parseInt(page as string, 10);
    const limitNumber = parseInt(limit as string, 10);

    if (
      isNaN(pageNumber) ||
      isNaN(limitNumber) ||
      pageNumber < 1 ||
      limitNumber < 1
    ) {
      throw new AppError("invalid page or limit parametrs", 400);
    }

    const offset = (pageNumber - 1) * limitNumber; // Calculate offset

    return { limit: limitNumber, offset, page: pageNumber };
  } else return undefined;
};

export default paginationUtil;
