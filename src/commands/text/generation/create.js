import { stdin } from "node:process";

import { readJSONStream } from "../../../utils/streams.js";
import { groupOptions } from "../../../utils/yargs.js";
import { parseInput } from "../../../utils/parsers.js";
import { clientMiddleware } from "../../../middleware/client.js";

import { generationConfig, generationMiddleware } from "./index.js";

export const createCommandDefinition = [
  ["create [inputs..]"],
  "Generate text based on input(s)",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .options(generationConfig)
      .middleware(generationMiddleware)
      .positional("inputs", {
        describe: "Inputs for the generation",
        type: "array",
      })
      .options(
        groupOptions({
          "allow-errors": {
            type: "boolean",
            description: "Continue if generation fails for an input",
            default: false,
          },
        })
      ),
  async (args) => {
    const inlineInputs = args.inputs;
    const inputs =
      inlineInputs ?? (await readJSONStream(stdin)).map(parseInput);

    const { model, parameters, allowErrors } = args;
    const promises = inputs.map((input) =>
      args.client.text.generation.create(
        {
          model_id: model,
          parameters,
          input,
        },
        {
          signal: args.timeout,
        }
      )
    );

    if (allowErrors) {
      for (const { status, value, reason } of await Promise.allSettled(
        promises
      )) {
        switch (status) {
          case "fulfilled":
            args.print(value);
            break;
          case "rejected":
            args.print(reason);
            break;
        }
      }
    } else {
      for (const output of await Promise.all(promises)) {
        args.print(output);
      }
    }
  },
];
