import { createReadStream } from "node:fs";
import path from "node:path";

import { FilePurposeSchema } from "@ibm-generative-ai/node-sdk";

import { groupOptions } from "../../utils/yargs.js";
import { prettyPrint } from "../../utils/print.js";

export const uploadCommandDefinition = [
  "upload <file>",
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
            choices: FilePurposeSchema.options,
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
    const { id, file_name, purpose, created_at } = await args.client.file({
      purpose: args.purpose,
      filename: args.name ?? path.parse(args.file).base,
      file: createReadStream(args.file),
    });
    prettyPrint({ id, name: file_name, purpose, created_at });
  },
];
