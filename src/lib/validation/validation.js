import AppError from "../../utils/error/error.js";

export const validationBody = (dto, body) => {
  const result = dto.safeParse(body);
  console.log(result.error);


  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      return `${issue.path[0]}: ${issue.message}`;
    });
    throw new AppError(errors, 400);
  }
  return result.data;
};

export const validationParams = (dto, params) => {
  const result = dto.safeParse(params);
  if (!result.success) {
    const errors = result.error.issues.map((issue) => {
      return `${issue.path[0]}: ${issue.message}`;
    });
    throw new AppError(errors, 400);
  }
  return result.data;
};
