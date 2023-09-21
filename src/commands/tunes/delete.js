export const deleteCommandDefinition = [
  "delete <id>",
  "Delete a tuned model",
  (yargs) =>
    yargs.positional("id", {
      type: "string",
      description: "Identifier of the tuned model",
    }),
  async (args) => {
    await args.client.tune({ id: args.id }, { delete: true });
  },
];
