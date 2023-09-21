export const methodsCommandDefinition = [
  "methods",
  "List all tune methods",
  {},
  async (args) => {
    const methods = await args.client.tuneMethods();
    methods.forEach((method) => {
      console.log(`${method.id} (${method.name})`);
    });
  },
];
