export const typesCommandDefinition = [
  "types",
  "List all tune types",
  {},
  async (args) => {
    const { results } = await args.client.tune.types({});
    args.print(results);
  },
];
