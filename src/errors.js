import { BaseError, InvalidInputError } from "@ibm-generative-ai/node-sdk";

export const isUsageError = (err) =>
  !(err instanceof BaseError) || err instanceof InvalidInputError;
