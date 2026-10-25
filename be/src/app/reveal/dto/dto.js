import { z } from "zod";
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");
export const createRevealDto = z.object({ messageId: objectId });
export const revealIdParam = z.object({ id: objectId });
