import z from "zod";

export const sendMessageDto = z.object({
  content: z
    .string()
    .trim()
    .min(1, "Message can't be empty")
    .max(500, "Message must be 500 characters or fewer"),
  // The recipient's public share id (NOT the database id).
  receiver: z
    .string()
    .trim()
    .min(4)
    .max(40)
    .regex(/^[A-Za-z0-9_-]+$/, "Invalid recipient"),
});

export const listMessagesQuery = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z
    .string()
    .regex(/^[a-f\d]{24}$/i)
    .optional(),
});

export const messageIdParam = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid message id"),
});
