import { createReadStream } from "node:fs";
import { stdin } from "node:process";

import { readJSONStream } from "../../../utils/streams.js";
import { groupOptions } from "../../../utils/yargs.js";
import { parseInput } from "../../../utils/parsers.js";

export const createCommandDefinition = [
  ["create [inputs..]"], // Default subcommand for generate command
  "Generate a text based on an input. Outputs will follow JSONL format. Inputs coming from stdin MUST follow the JSONL format.",
  (yargs) =>
    yargs
      .positional("inputs", {
        describe: "Text serving as an input for the generation",
        type: "array",
      })
      .options(
        groupOptions({
          "file": {
            alias: "f",
            describe:
              "File to read the inputs from. File MUST follow JSONL format",
            array: true,
            normalize: true,
            requiresArg: true,
            conflicts: "inputs",
            coerce: async (files) => {
              const inputs = await Promise.all(
                files.map((file) => readJSONStream(createReadStream(file)))
              );
              return inputs.flat().map(parseInput);
            },
          },
          "allow-errors": {
            type: "boolean",
            description: "Continue if generation fails for an input",
            default: false,
          },
        })
      ),
  async (args) => {
    const fileInputs = args.file;
    const inlineInputs = args.inputs;
    const inputs =
      inlineInputs ??
      fileInputs ??
      (await readJSONStream(stdin)).map(parseInput);

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
