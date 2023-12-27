export const infoCommandDefinition = [
  "info <id>",
  "Show detailed information about a file",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the file",
    }),
  async (args) => {
    const file = await args.client.file({
      id: args.id,
    });
    args.print(file);
  },
];
