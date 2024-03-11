import { groupOptions } from "../../../utils/yargs.js";

export const createCommandDefinition = [
  ["create <message>"],
  "Have conversation with a model",
  (yargs) =>
    yargs
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
    const input = args.message;

    const response = await args.client.text.chat(
      {
        messages: [
          {
            role: args.role,
            content: input,
          },
        ],
      },
      { signal: AbortSignal.timeout(args.timeout) }
    );
    args.print(response);
  },
];
