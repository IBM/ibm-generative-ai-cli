import { createReadStream } from "node:fs";
import path from "node:path";

import { groupOptions } from "../../utils/yargs.js";

export const createCommandDefinition = [
  "create <file>",
  "Upload a file",
  (yargs) =>
    yargs
      .positional("file", {
        type: "string",
        describe: "Filepath to the file to be uploaded",
        normalize: true,
      })
      .options(
        groupOptions({
          purpose: {
            alias: "p",
            description: "Purpose of the file",
            requiresArg: true,
            demandOption: true,
          },
          name: {
            alias: "n",
            type: "string",
            description: "Name of the file",
            requiresArg: true,
          },
        })
      ),
  async (args) => {
    const { purpose, name, file } = args;
    const { result } = await args.client.file.create(
      {
        purpose,
        file: {
          name: name ?? path.parse(file).base,
          content: new Blob(await createReadStream(file).toArray()),
        },
      },
      { signal: args.timeout }
    );
    args.print(result);
  },
];
