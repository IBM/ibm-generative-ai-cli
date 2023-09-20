import { prettyPrint } from "../../utils/print.js";

export const infoCommandDefinition = [
  "info <id>",
  "Show detailed information about a file",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the file",
    }),
  async (args) => {
    const { id, file_name, purpose, created_at } = await args.client.file({
      id: args.id,
    });
    prettyPrint({ id, name: file_name, purpose, created_at });
  },
];
