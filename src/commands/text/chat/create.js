import { groupOptions } from "../../../utils/yargs.js";
import { clientMiddleware } from "../../../middleware/client.js";
import { generationConfig, generationMiddleware } from "../generation/index.js";

export const createCommandDefinition = [
  ["create <message>"],
  "Have conversation with a model",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .positional("message", {
        type: "string",
        describe: "Content of the message",
      })
      .options(
        groupOptions({
          conversation: {
            alias: "c",
            type: "string",
            describe: "Continue in existing conversation",
          },
          role: {
            alias: "r",
            type: "string",
            describe: "Role",
            choices: ["system", "user", "assistant"],
            default: "user",
          },
        })
      )
      .options(generationConfig)
      .middleware(generationMiddleware),
  async (args) => {
    const { model, message } = args;
    const output = await args.client.text.chat.create(
      {
        model_id: model,
        messages: [
          {
            role: args.role,
            content: message,
          },
        ],
      },
      { signal: args.timeout }
    );
    args.print(output);
  },
];
