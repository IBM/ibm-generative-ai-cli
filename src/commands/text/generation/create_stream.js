export const createStreamCommandDefinition = [
  ["create-stream input"], // Default subcommand for generate command
  "Generate a text based on an input. Outputs will follow JSONL format. Inputs coming from stdin MUST follow the JSONL format.",
  (yargs) =>
    yargs.positional("input", {
      describe: "Text serving as an input for the generation",
      type: "string",
    }),
  async (args) => {
    const { model, parameters, input } = args;
    const stream = await args.client.text.generation.create_stream(
      {
        model_id: model,
        parameters,
        input,
      },
      {
        signal: args.timeout,
      }
    );
    for await (const output of stream) {
      args.print(output);
    }
  },
];
