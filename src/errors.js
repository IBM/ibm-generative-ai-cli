import {
  BaseError,
  InvalidInputError as InvalidInputSDKError,
} from "@ibm-generative-ai/node-sdk";

export class InvalidInputError extends Error {}

export const isUsageError = (err) =>
  !(err instanceof BaseError) ||
  err instanceof InvalidInputSDKError ||
  err instanceof InvalidInputError;
