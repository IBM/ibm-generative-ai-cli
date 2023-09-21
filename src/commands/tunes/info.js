import { prettyPrint } from "../../utils/print.js";

export const infoCommandDefinition = [
  "info <id>",
  "Show detailed information about a tuned model",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the tuned model",
    }),
  async (args) => {
    const { id, name } = await args.client.tune({
      id: args.id,
    });
    prettyPrint({ id, name });
  },
];
