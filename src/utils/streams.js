import { compose } from "node:stream";

import Parser from "stream-json/Parser.js";
import StreamValues from "stream-json/streamers/StreamValues.js";

import { parseInput } from "./parsers.js";

export const createInputStream = (stream) =>
  compose(
    stream,
    new Parser({ jsonStreaming: true }),
    new StreamValues(),
    async function* (source) {
      for await (const value of source) {
        yield parseInput(value.value);
      }
    }
  );

export function createBatchTransform({ batchSize }) {
  if (batchSize < 1) throw new Error("Batch size must be positive");

  return async function* (source) {
    let batch = [];
    for await (const item of source) {
      if (batch.length >= batchSize) {
        yield batch;
        batch = [];
      }
      batch.push(item);
    }
    if (batch.length > 0) yield batch;
  };
}
