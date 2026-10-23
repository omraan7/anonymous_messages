import AppError from "../../utils/error/error.js";

const parse = (dto, input) => {
  const result = dto.safeParse(input);
  if (!result.success) {
    const errors = result.error.issues.map((i) => ({ field: String(i.path[0] ?? ""), message: i.message }));
    throw new AppError(errors[0]?.message || "Invalid input", 400, { code: "VALIDATION", errors });
  }
  return result.data;
};
export const validationBody = parse;
export const validationParams = parse;
