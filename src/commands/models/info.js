export const infoCommandDefinition = [
  "info <model>",
  "Show detailed information about a model",
  {
    model: {
      type: "string",
    },
  },
  async (args) => {
    const {
      id,
      name,
      size,
      description,
      token_limit,
      source_model,
      family,
      tasks,
      tags,
    } = await args.client.model({ id: args.model });

    args.print({
      id,
      name,
      size,
      description,
      source_model: source_model?.id,
      family,
      token_limit,
      tasks,
      tags,
    });
  },
];
