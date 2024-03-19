import { stdin } from "node:process";
import { Readable, compose } from "node:stream";

import { clientMiddleware } from "../../../middleware/client.js";
import {
  createBatchTransform,
  createInputStream,
} from "../../../utils/streams.js";
import { groupOptions } from "../../../utils/yargs.js";

export const createCommandDefinition = [
  "create [inputs..]",
  "Convert the provided inputs into tokens",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .positional("inputs", {
        describe: "Text serving as an input for the generation",
        type: "array",
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
      )
      .options(
        groupOptions(
          {
            "batch-size": {
              type: "number",
              requiresArg: true,
              describe: "Batch size for inputs",
              default: 100,
            },
            "allow-errors": {
              type: "boolean",
              description:
                "Continue even if tokenization fails for a batch of inputs",
              default: false,
            },
          },
          "Options:"
        )
      ),
  async (args) => {
    const inlineInputs = args.inputs;
    const inputStream =
      inlineInputs.length > 0
        ? Readable.from(inlineInputs)
        : createInputStream(stdin);
    const { model, tokens, inputText, batchSize, allowErrors } = args;

    for await (const inputs of compose(
      inputStream,
      createBatchTransform({ batchSize })
    )) {
      try {
        const output = await args.client.text.tokenization.create(
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
        args.print(output);
      } catch (err) {
        if (allowErrors) {
          args.print(err);
        } else {
          throw err;
        }
      }
    }
  },
];
