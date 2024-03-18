export const retrieveCommandDefinition = [
  "retrieve <id>",
  "Show detailed information about a file",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the file",
    }),
  async (args) => {
    const output = await args.client.file.retrieve(
      {
        id: args.id,
      },
      { signal: args.timeout }
    );
    args.print(output);
  },
];
