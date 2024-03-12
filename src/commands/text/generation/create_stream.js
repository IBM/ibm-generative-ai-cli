import { clientMiddleware } from "../../../middleware/client.js";

import { generationConfig, generationMiddleware } from "./index.js";

export const createStreamCommandDefinition = [
  ["create-stream <input>"],
  "Generate text based on input",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .options(generationConfig)
      .middleware(generationMiddleware)
      .positional("input", {
        describe: "Input for the generation",
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
