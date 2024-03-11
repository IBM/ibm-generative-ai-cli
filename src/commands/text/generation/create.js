import { createReadStream, createWriteStream } from "node:fs";
import { stdin, stdout } from "node:process";

import { BaseError as BaseSDKError } from "@ibm-generative-ai/node-sdk";

import { readJSONStream } from "../../../utils/streams.js";
import { groupOptions } from "../../../utils/yargs.js";
import { parseInput } from "../../../utils/parsers.js";

export const createCommandDefinition = [
  ["create [input]"], // Default subcommand for generate command
  "Generate a text based on an input. Outputs will follow JSONL format. Inputs coming from stdin MUST follow the JSONL format.",
  (yargs) =>
    yargs
      .positional("input", {
        describe: "Text serving as an input for the generation",
        type: "string",
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
    const mappedInputs = inputs.map((input) => ({
      model_id: args.model ?? "default",
      parameters: args.parameters,
      input,
    }));

    let hasError = false;
    if (args.parameters?.stream) {
      try {
        for await (const chunk of args.client.text.generation.create_stream(
          mappedInputs,
          {
            signal: AbortSignal.timeout(args.timeout),
          }
        )) {
          outputStream.write(chunk.generated_text);
        }
      } catch (err) {
        hasError = true;
        outputStream.write(JSON.stringify({ error: err.message }));
      } finally {
        outputStream.write("\n");
      }
    } else {
      for (const promise of args.client.text.generation.create(mappedInputs, {
        signal: AbortSignal.timeout(args.timeout),
      })) {
        try {
          const output = await promise;
          outputStream.write(JSON.stringify(output.generated_text));
        } catch (err) {
          hasError = true;
          outputStream.write(JSON.stringify({ error: err.message }));
        } finally {
          outputStream.write("\n");
        }
      }
    }

    if (hasError) {
      throw new BaseSDKError(
        "Errors have been encountered during generation, see output"
      );
    }
  },
];
