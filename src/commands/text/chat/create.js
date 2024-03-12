import { groupOptions } from "../../../utils/yargs.js";
import { clientMiddleware } from "../../../middleware/client.js";
import { generationConfig, generationMiddleware } from "../generation/index.js";

export const createCommandDefinition = [
  ["create <message>"],
  "Have conversation with a model",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .middleware(clientMiddleware)
      .options(generationConfig)
      .middleware(generationMiddleware)
      .options(
        groupOptions({
          model: {
            alias: "m",
            describe: "Select a model to be used for chat",
            requiresArg: true,
            type: "string",
            coerce: (parameters) => {
              if (typeof parameters !== "string")
                throw new Error("Only a single model must be specified");
              return parameters;
            },
          },
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
      .positional("message", {
        describe: "",
        array: true,
      }),
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
