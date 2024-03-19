import { stdin } from "node:process";
import { Readable } from "node:stream";

import { createInputStream } from "../../../utils/streams.js";
import { groupOptions } from "../../../utils/yargs.js";
import { clientMiddleware } from "../../../middleware/client.js";

import { generationConfig, generationMiddleware } from "./index.js";

const REQUEST_LIMIT = 1000; // We want to have reasonable memory footprint while maintaining full performance

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
    const inputStream =
      inlineInputs.length > 0
        ? Readable.from(inlineInputs)
        : createInputStream(stdin);

    const { model, parameters, allowErrors } = args;

    const requests = [];
    const consume = async (request) => {
      try {
        const output = await request;
        args.print(output);
      } catch (err) {
        if (allowErrors) {
          args.print(err);
        } else {
          throw err;
        }
      }
    };
    // Produce requests
    for await (const input of inputStream) {
      // If limit has been reached, consume the oldest request first
      if (requests.length >= REQUEST_LIMIT) await consume(requests.shift());
      requests.push(
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
    }
    // Consume remaining requests
    for (const request of requests) {
      await consume(request);
    }
  },
];
