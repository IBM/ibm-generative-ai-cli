import { FilePurposeSchema } from "@ibm-generative-ai/node-sdk";

import { groupOptions } from "../../utils/yargs.js";

export const listCommandDefinition = [
  "list",
  "List all files",
  groupOptions({
    purpose: {
      alias: "p",
      type: "array",
      description: "Filter listed by purpose",
      requiresArg: true,
      choices: FilePurposeSchema.options,
    },
  }),
  async (args) => {
    for await (const file of args.client.files()) {
      if (!args.purpose || args.purpose.includes(file.purpose)) {
        console.log(`${file.id} (${file.file_name})`);
      }
    }
  },
];
