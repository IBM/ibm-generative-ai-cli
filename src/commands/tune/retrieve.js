export const retrieveCommandDefinition = [
  "retrieve <id>",
  "Show detailed information about a tuned model",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the tuned model",
    }),
  async (args) => {
    const { id } = args;
    const output = await args.client.tune.retrieve(
      {
        id,
      },
      { signal: args.timeout }
    );
    args.print(output);
  },
];
