import { randomUUID } from 'crypto';

export const correlationId = (req, res, next) => {
  const id = randomUUID();

  req.correlationId = id;

  res.setHeader("X-Correlation-ID", id);

  next();
};