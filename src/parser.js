import { stdin, stdout } from "node:process";
import { createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import _ from "lodash";
import { BaseError as BaseSDKError } from "@ibm-generative-ai/node-sdk";

import { parseInput } from "./utils/parsers.js";
import { readJSONStream } from "./utils/streams.js";
import { prettyPrint } from "./utils/print.js";
import {
  isAbortError,
  pickDefined,
  isCancelOperationKey,
} from "./utils/common.js";
import { groupOptions } from "./utils/yargs.js";
import { loadConfig, mergeConfig, storeConfig } from "./utils/config.js";
import { clientMiddleware } from "./middleware/client.js";

export const parser = yargs(hideBin(process.argv))
  .options({
    endpoint: {
      describe: "Provide custom endpoint",
      defaultDescription: "GENAI_ENDPOINT or config",
      requiresArg: true,
      type: "string",
    },
    apiKey: {
      alias: "k",
      describe: "Provide your api key",
      defaultDescription: "GENAI_API_KEY or config",
      requiresArg: true,
      type: "string",
    },
    timeout: {
      describe: "Request timeout in milliseconds",
      requiresArg: true,
      type: "number",
      defaultDescription: "none",
    },
  })
  .help()
  .alias("h", "help")
  .updateStrings({ "Options:": "Global Options:" })
  .command(
    "config",
    "Modify the CLI configuration using an interactive prompt",
    (yargs) =>
      yargs.options(
        groupOptions({
          show: {
            describe: "Only show the config, do not prompt",
            type: "boolean",
          },
          reset: {
            describe: "Reset the config",
            type: "boolean",
            conflicts: ["show"],
          },
        })
      ),
    async (args) => {
      if (args.reset) {
        storeConfig({});
      } else if (!args.show) {
        const rl = createInterface({
          input: stdin,
          output: stdout,
        });
        const question = promisify(rl.question).bind(rl);
        rl.on("close", () => {
          console.log();
        });

        const config = {
          configuration: {},
          credentials: {},
        };
        const endpoint = await question("Endpoint (leave empty to skip): ");
        if (endpoint) {
          config.configuration.endpoint = endpoint;
        }
        const apiKey = await question("API Key (leave empty to skip): ");
        if (apiKey) {
          config.credentials.apiKey = apiKey;
        }

        rl.close();
        mergeConfig(config);
      }

      const config = loadConfig();
      prettyPrint(config);
    }
  )
  .command("generate", "Generate a text from an input text", (yargs) =>
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
            stream: {
              type: "boolean",
              description:
                "Enables to stream partial progress as server-sent events.",
            },
            "decoding-method": {
              type: "string",
              requiresArg: true,
              nargs: 1,
              choices: ["greedy", "sample"],
              description:
                "Represents the strategy used for picking the tokens during generation of the output text",
            },
            "decay-factor": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description: "Represents the factor of exponential decay",
            },
            "decay-start-index": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description:
                "A number of generated tokens after which the decay factor should take effect",
            },
            "max-new-tokens": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description: "The maximum number of new tokens to be generated",
            },
            "min-new-tokens": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description: "The minimum number of new tokens to be generated",
            },
            "random-seed": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description:
                "Random number generator seed to use in sampling mode for experimental repeatability",
            },
            "stop-sequences": {
              array: true,
              type: "string",
              requiresArg: true,
              description:
                "One or more strings which will cause the text generation to stop if detected in the output",
            },
            temperature: {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description:
                "A value used to modify the next-token probabilities in sampling mode",
            },
            "time-limit": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description: "Time limit in milliseconds",
            },
            "top-k": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description:
                "The number of highest probability vocabulary tokens to keep for top-k-filtering",
            },
            "top-p": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description:
                "The number of highest probability vocabulary tokens to keep for top-p-filtering",
            },
            "repetition-penalty": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description:
                "Represents the penalty for repeated tokens in the output",
            },
            "truncate-input-tokens": {
              type: "number",
              requiresArg: true,
              nargs: 1,
              description:
                "Represents the number to which input tokens would be truncated",
            },
          },
          "Configuration:"
        )
      )
      .middleware((args) => {
        const length_penalty = pickDefined({
          decay_factor: args.decayFactor,
          start_index: args.decayStartIndex,
        });
        const parameters = pickDefined({
          decoding_method: args.decodingMethod,
          length_penalty: !_.isEmpty(length_penalty)
            ? length_penalty
            : undefined,
          max_new_tokens: args.maxNewTokens,
          min_new_tokens: args.minNewTokens,
          random_seed: args.randomSeed,
          stop_sequences: args.stopSequences,
          temperature: args.temperature,
          time_limit: args.timeLimit,
          top_k: args.topK,
          top_p: args.topP,
          repetition_penalty: args.repetitionPenalty,
          truncate_input_tokens: args.truncateInputTokens,
          stream: args.stream,
        });
        args.parameters = !_.isEmpty(parameters) ? parameters : undefined;
      })
      .command(
        ["$0 [inputs..]"], // Default subcommand for generate command
        "Generate a text based on an input. Outputs will follow JSONL format. Inputs coming from stdin MUST follow the JSONL format.",
        (yargs) =>
          yargs
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
                      files.map((file) =>
                        readJSONStream(createReadStream(file))
                      )
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
                      throw new Error(
                        "Only a single output file must be specified"
                      );
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
              for await (const chunk of args.client.generate(mappedInputs, {
                timeout: args.timeout,
                stream: true,
              })) {
                outputStream.write(chunk.generated_text);
              }
            } catch (err) {
              hasError = true;
              outputStream.write(JSON.stringify({ error: err.message }));
            } finally {
              outputStream.write("\n");
            }
          } else {
            for (const promise of args.client.generate(mappedInputs, {
              timeout: args.timeout,
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
        }
      )
      .command(
        "interactive",
        "Interactive context-free generate session",
        {},
        async (args) => {
          if (args.parameters?.stream === false) {
            throw new Error(
              "Stream is automatically enabled for interactive mode."
            );
          }

          const ctx = {
            isTerminated: false,
            isProcessing: false,
            abortOperation: () => {},
          };

          const onUserActionCancel = () => {
            ctx.abortOperation();
            if (!ctx.isProcessing) {
              ctx.isTerminated = true;
            }
          };

          const rl = createInterface({
            input: new Proxy(stdin, {
              get(target, prop) {
                if (prop === "on" || prop === "addEventListener") {
                  return (event, handler) => {
                    if (event === "data") {
                      const originalHandler = handler;
                      handler = (chunk) => {
                        if (!ctx.isProcessing || isCancelOperationKey(chunk)) {
                          originalHandler(chunk);
                        }
                      };
                    }
                    return target.on(event, handler);
                  };
                }
                return target[prop];
              },
            }),
            output: stdout,
            prompt: "",
          })
            .on("SIGINT", onUserActionCancel)
            .on("SIGTSTP", onUserActionCancel)
            .on("SIGCONT", onUserActionCancel)
            .on("history", (history) => {
              if (ctx.isProcessing) {
                history.shift();
              }
            });

          while (!ctx.isTerminated) {
            ctx.isProcessing = false;

            try {
              const controller = new AbortController();
              ctx.abortOperation = () => controller.abort();

              const question = promisify(rl.question).bind(rl);
              const input = await question("GenAI> ", controller);

              ctx.isProcessing = true;
              if (input.length > 0) {
                const stream = args.client.generate(
                  {
                    input: input,
                    model_id: args.model ?? "default",
                    parameters: args.parameters,
                  },
                  {
                    timeout: args.timeout,
                    signal: controller.signal,
                    stream: true,
                  }
                );

                for await (const chunk of stream) {
                  rl.write(chunk.generated_text);
                }
                rl.write("\n");
              }
            } catch (err) {
              if (isAbortError(err)) {
                // Clear line due to broken cursor
                rl.write("\n");
                rl.write(null, { ctrl: true, name: "u" });
              } else {
                console.error(err.message);
              }
            }
          }

          rl.write("Goodbye");
          rl.write("\n");
          rl.close();
        }
      )
      .command(
        "config",
        "Read and modify generate configuration",
        (yargs) =>
          yargs
            .options(
              groupOptions(
                {
                  "input-text": {
                    type: "boolean",
                    description: "Include input text",
                  },
                  "generated-tokens": {
                    type: "boolean",
                    description:
                      "Include the list of individual generated tokens",
                  },
                  "input-tokens": {
                    type: "boolean",
                    description: "Include the list of input tokens",
                  },
                  "token-logprobs": {
                    type: "boolean",
                    description: "Include logprob for each token",
                  },
                  "token-ranks": {
                    type: "boolean",
                    description: "Include rank of each returned token",
                  },
                  "top-n-tokens": {
                    type: "number",
                    requiresArg: true,
                    nargs: 1,
                    description:
                      "Include top n candidate tokens at the position of each returned token",
                  },
                },
                "Configuration:"
              )
            )
            .middleware((args) => {
              const return_options = pickDefined({
                input_text: args.inputText,
                generated_tokens: args.generatedTokens,
                input_tokens: args.inputTokens,
                token_logprobs: args.tokenLogprobs,
                input_ranks: args.tokenRanks,
                top_n_tokens: args.topNTokens,
              });
              args.parameters = !_.isEmpty(return_options)
                ? _.merge({}, args.parameters, { return_options })
                : args.parameters;
            })
            .options(
              groupOptions({
                reset: {
                  describe: "Reset the config",
                  type: "boolean",
                },
                replace: {
                  describe: "Replace the entire config",
                  type: "boolean",
                  conflicts: "reset",
                },
              })
            ),
        async (args) => {
          const hasInput = args.model || args.parameters;

          const output = hasInput
            ? await args.client.generateConfig(
                {
                  model_id: args.model,
                  parameters: args.parameters,
                },
                {
                  strategy: args.replace ? "replace" : "merge",
                  timeout: args.timeout,
                }
              )
            : await args.client.generateConfig({
                reset: args.reset,
                timeout: args.timeout,
              });

          prettyPrint(output);
        }
      )
      .example('$0 generate "Hello World"', "Supply single input")
      .example("$0 generate -f inputs.jsonl", "Supply JSONL file with inputs")
      .example(
        "$0 generate config -m google/flan-t5-xxl --random-seed 2",
        "Modify generate configuration with a given model and parameters"
      )
      .demandCommand(1, 1, "Please choose a command")
  )
  .command("models", "Show information about available models", (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command("list", "List all available models", {}, async (args) => {
        const models = await args.client.models();
        models.forEach((model) => {
          console.log(model.id);
        });
      })
      .command(
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

          prettyPrint({
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
        }
      )
      .command(
        "schema <model>",
        "Show validation schema for a model",
        {
          type: {
            alias: "t",
            describe: "Type of the schema to show",
            demandOption: true,
            choices: ["generate", "tokenize"],
            requiresArg: true,
            type: "string",
          },
          model: {
            type: "string",
          },
        },
        async (args) => {
          const { schema_generate, schema_tokenize } = await args.client.model({
            id: args.model,
          });

          if (args.type === "generate") prettyPrint(schema_generate.value);
          else if (args.type === "tokenize") prettyPrint(schema_tokenize.value);
        }
      )
      .demandCommand(1, 1, "Please choose a command")
  )
  .command("tokenize", "Convert provided inputs to tokens", (yargs) =>
    yargs
      .command(
        "$0 [inputs..]",
        "Convert provided inputs to tokens. Tokenization is model specific.",
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
                        throw new Error(
                          "Only a single model must be specified"
                        );
                      return parameters;
                    },
                  },
                  returnTokens: {
                    type: "boolean",
                    default: true,
                    description:
                      "Return tokens with the response. Defaults to true.",
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
                      files.map((file) =>
                        readJSONStream(createReadStream(file))
                      )
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
                      throw new Error(
                        "Only a single output file must be specified"
                      );
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
                  timeout: args.timeout,
                }
              );
              return { token_count, tokens };
            })
          );

          let hasError = false;
          for (const result of results) {
            if (result.status === "rejected") {
              hasError = true;
              outputStream.write(
                JSON.stringify({ error: result.reason?.message })
              );
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
        }
      )
      .demandCommand(1, 1, "Please choose a command")
  )
  .demandCommand(1, 1, "Please choose a command")
  .config(loadConfig().configuration)
  .strict()
  .fail(false);
