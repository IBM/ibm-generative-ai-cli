export const typesCommandDefinition = [
  "types",
  "List all tune types",
  {},
  async (args) => {
    const output = await args.client.tune.types({}, { signal: args.timeout });
    args.print(output);
  },
];
