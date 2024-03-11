export const retrieveCommandDefinition = [
  "retrieve <id>",
  "Retrieve information about a model",
  (yargs) => yargs.positional("id", { type: "string" }),
  async (args) => {
    const { result } = await args.client.model.retrieve(
      { id: args.id },
      { signal: args.timeout }
    );
    args.print(result);
  },
];
