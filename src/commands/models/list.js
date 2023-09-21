export const listCommandDefinition = [
  "list",
  "List all available models",
  {},
  async (args) => {
    const models = await args.client.models();
    models.forEach((model) => {
      console.log(model.id);
    });
  },
];
