import { stdin, stdout } from "node:process";
import { createReadStream, createWriteStream } from "node:fs";

import { BaseError as BaseSDKError } from "@ibm-generative-ai/node-sdk";

import { clientMiddleware } from "../../middleware/client.js";
import { parseInput } from "../../utils/parsers.js";
import { readJSONStream } from "../../utils/streams.js";
import { groupOptions } from "../../utils/yargs.js";

export const tokenizationCommandDefinition = [
  "tokenization [inputs..]",
  "Converts the provided inputs to tokens. Tokenization is model specific.",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .options(
        groupOptions(
          {
            model: {
              alias: "m",
              describe: "Select a model to be used for generation",
              requiresArg: true,
              type: "string",
              coerce: (parameters) => {
                if (typeof parameters !== "string")
                  throw new Error("Only a single model must be specified");
                return parameters;
              },
            },
            returnTokens: {
              type: "boolean",
              default: true,
              description: "Return tokens with the response. Defaults to true.",
            },
          },
          "Configuration:"
        )
      )
      .positional("inputs", {
        describe: "Text serving as an input for the generation",
        array: true,
        conflicts: "input",
      })
      .options(
        groupOptions({
          file: {
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
          output: {
            alias: "o",
            describe: "File to write the outputs to",
            type: "string",
            normalize: true,
            requiresArg: true,
            coerce: (output) => {
              if (typeof output !== "string")
                throw new Error("Only a single output file must be specified");
              return createWriteStream(output);
            },
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

    const outputStream = args.output ?? stdout;
    const results = await Promise.allSettled(
      inputs.map(async (input) => {
        const { token_count, tokens } = await args.client.tokenize(
          {
            model_id: args.model ?? "default",
            parameters: {
              return_tokens: args.returnTokens,
            },
            input,
          },
          {
            signal: AbortSignal.timeout(args.timeout),
          }
        );
        return { token_count, tokens };
      })
    );

    let hasError = false;
    for (const result of results) {
      if (result.status === "rejected") {
        hasError = true;
        outputStream.write(JSON.stringify({ error: result.reason?.message }));
      } else {
        outputStream.write(JSON.stringify(result.value));
      }
      outputStream.write("\n");
    }

    if (hasError) {
      throw new BaseSDKError(
        "Errors have been encountered during tokenization, see output"
      );
    }
  },
];
