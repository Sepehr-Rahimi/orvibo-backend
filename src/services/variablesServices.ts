import { initModels } from "../models/init-models";
import { AppError } from "../utils/error";

const Variables = initModels().variables;

export const getVariableByName = async (name: string) => {
  const variable = await Variables.findOne({ where: { name } });
  if (!variable) throw new AppError(`${name} is not exist in variables`, 404);
  return variable;
};
