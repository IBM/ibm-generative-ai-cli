export const typesCommandDefinition = [
  "types",
  "List all tune types",
  {},
  async (args) => {
    const methods = await args.client.tuneMethods();
    methods.forEach((method) => {
      console.log(`${method.id} (${method.name})`);
    });
  },
];
