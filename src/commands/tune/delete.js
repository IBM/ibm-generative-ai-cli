export const deleteCommandDefinition = [
  "delete <id>",
  "Delete a tuned model",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the tuned model",
    }),
  async (args) => {
    const { id } = args;
    await args.client.tune.delete({ id });
  },
];
