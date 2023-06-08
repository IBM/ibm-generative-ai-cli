import { pipeline } from "stream/promises";

import Parser from "stream-json/Parser.js";
import StreamValues from "stream-json/streamers/StreamValues.js";

export const readJSONStream = async (stream) => {
  const values = [];
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
  return values;
};
