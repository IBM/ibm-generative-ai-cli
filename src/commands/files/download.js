import { stdout } from "node:process";
import { createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";

import { groupOptions } from "../../utils/yargs.js";

export const downloadCommandDefinition = [
  "download <id>",
  "Download a file",
  (yargs) =>
    yargs
      .positional("id", {
        type: "string",
        description: "Identifier of the file to download",
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
    const { download } = await args.client.file({
      id: args.id,
    });
    const readable = await download();
    await pipeline(readable, args.output ?? stdout);
  },
];
