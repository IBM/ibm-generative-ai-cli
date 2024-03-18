import { stdout } from "node:process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export const readCommandDefinition = [
  "read <id>",
  "Read file contents",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the file to read",
    }),
  async (args) => {
    const blob = await args.client.file.read(
      {
        id: args.id,
      },
      { signal: args.timeout }
    );
    const readable = Readable.fromWeb(blob.stream());
    await pipeline(readable, stdout);
  },
];
