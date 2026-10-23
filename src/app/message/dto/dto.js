import { Types } from "mongoose";
import z from "zod";

export const sendMessageDto = z.object({
  content: z.string().min(2).max(500).trim(),
  receiver: z
    .string()
    .trim()
    .refine((val) => {
      return Types.ObjectId.isValid(val);
    }),
});
