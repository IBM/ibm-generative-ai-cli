import { stdout } from "node:process";
import { pipeline } from "node:stream/promises";
import { Readable } from "node:stream";

export const readCommandDefiniton = [
  "read <asset> <id>",
  "Download assets of a completed tuned model",
  (yargs) =>
    yargs
      .positional("id", {
        type: "string",
        description: "Identifier of the tuned model",
      })
      .positional("type", {
        describe: "Type of the asset",
      }),
  async (args) => {
    const { id, type } = args;
    const blob = await args.client.tune.read(
      {
        id,
        type,
      },
      { signal: args.timeout }
    );
    const readable = Readable.fromWeb(blob.stream());
    await pipeline(readable, args.output ?? stdout);
  },
];
