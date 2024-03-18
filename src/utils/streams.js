import { pipeline } from "stream/promises";

import Parser from "stream-json/Parser.js";
import StreamValues from "stream-json/streamers/StreamValues.js";

import { InvalidInputError } from "../errors.js";

export const readJSONStream = async (stream) => {
  const values = [];
  try {
    await pipeline(
      stream,
      new Parser({ jsonStreaming: true }),
      new StreamValues(),
      async function (source) {
        for await (const value of source) {
          values.push(value.value);
        }
      }
    );
  } catch (err) {
    throw new InvalidInputError(
      "Failed to parse JSON stream, please check your input",
      { cause: err }
    );
  }
  return values;
};
