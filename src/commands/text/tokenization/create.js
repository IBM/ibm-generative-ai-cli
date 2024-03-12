import { stdin } from "node:process";

import { clientMiddleware } from "../../../middleware/client.js";
import { parseInput } from "../../../utils/parsers.js";
import { readJSONStream } from "../../../utils/streams.js";
import { groupOptions } from "../../../utils/yargs.js";

export const createCommandDefinition = [
  "create [inputs..]",
  "Convert the provided inputs into tokens",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .positional("inputs", {
        describe: "Text serving as an input for the generation",
        array: true,
        conflicts: "input",
      })
      .options(
        groupOptions(
          {
            "model": {
              alias: "m",
              describe: "ID of a model used for tokenization",
              demandOption: true,
              requiresArg: true,
              type: "string",
              coerce: (model) => {
                if (typeof model !== "string")
                  throw new Error("Only a single model must be specified");
                return model;
              },
            },
            "tokens": {
              type: "boolean",
              description: "Return tokens, not just the token count",
              default: true,
            },
            "input-text": {
              type: "boolean",
              description: "Return the tokenized inputs (useful for pipes)",
              default: false,
            },
          },
          "Configuration:"
        )
      ),
  async (args) => {
    const inlineInputs = args.inputs;
    const inputs =
      inlineInputs ?? (await readJSONStream(stdin)).map(parseInput);

    const { model, tokens, inputText } = args;
    const { results } = await args.client.text.tokenization.create(
      {
        model_id: model,
        input: inputs,
        parameters: {
          return_options: {
            input_text: inputText,
            tokens,
          },
        },
      },
      {
        signal: args.timeout,
      }
    );
    args.print(results);
  },
];
