export const retrieveCommandDefinition = [
  "retrieve <id>",
  "Show detailed information about a file",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the file",
    }),
  async (args) => {
    const { result } = await args.client.file.retrieve({
      id: args.id,
    });
    args.print(result);
  },
];
