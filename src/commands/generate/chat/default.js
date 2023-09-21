import { stdin } from "node:process";

import { prettyPrint } from "../../../utils/print.js";
import { readToString } from "../../../utils/streams.js";

export const defaultCommandDefinition = [
  "$0 [message]",
  "Send a single message",
  (yargs) =>
    yargs
      .positional("message", {
        describe: "Text serving as an input for the generation",
        type: "string",
      })
      .options({
        conversation: {
          alias: "c",
          type: "string",
          requiresArg: true,
        },
        role: {
          alias: "r",
          type: "string",
          requiresArg: true,
          choices: ["user", "assistant", "system"], // TODO Fill from SDK
          default: "user",
        },
      }),
  async (args) => {
    const output = await args.client.chat({
      model_id: args.model ?? "default",
      parameters: args.parameters,
      conversation_id: args.conversation,
      messages: [
        {
          role: args.role,
          content: args.content ?? (await readToString(stdin)),
        },
      ],
    });
    prettyPrint(output);
  },
];
