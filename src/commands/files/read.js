import { stdout } from "node:process";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

import { groupOptions } from "../../utils/yargs.js";

export const readCommandDefinition = [
  "read <id>",
  "Read file contents",
  (yargs) =>
    yargs
      .positional("id", {
        type: "string",
        description: "Identifier of the file to read",
      })
      .options(
        groupOptions({
          output: {
            alias: "o",
            describe: "Filepath to write the file to",
            type: "string",
            normalize: true,
            requiresArg: true,
            coerce: (output) => createWriteStream(output),
          },
        })
      ),
  async (args) => {
    const blob = await args.client.file.read(
      {
        id: args.id,
      },
      { signal: args.timeout }
    );
    const readable = Readable.fromWeb(blob.stream());
    await pipeline(readable, args.output ?? stdout);
  },
];
