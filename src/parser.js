import { stdin, stdout } from "node:process";
import { createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { promisify } from "node:util";
import path from "node:path";
import { pipeline } from "node:stream/promises";

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import _ from "lodash";
import dayjs from "dayjs";
import {
  BaseError as BaseSDKError,
  FilePurposeSchema,
  HistoryStatusSchema,
  HistoryOriginSchema,
  TuneAssetTypeSchema,
} from "@ibm-generative-ai/node-sdk";

import { parseDateTime, parseInput } from "./utils/parsers.js";
import { readJSONStream } from "./utils/streams.js";
import { prettyPrint } from "./utils/print.js";
import {
  isAbortError,
  pickDefined,
  isCancelOperationKey,
} from "./utils/common.js";
import { groupOptions } from "./utils/yargs.js";
import {
  loadProfileConfig,
  mergeConfig,
  deleteProfileConfig,
  allProfiles,
} from "./utils/config.js";
import { clientMiddleware } from "./middleware/client.js";
import { profileMiddleware } from "./middleware/profile.js";
import { DEFAULT_ENDPOINT } from "./utils/constants.js";

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
    profile: {
      describe: "Use a specific profile from your configuration",
      requiresArg: true,
      type: "string",
    },
  })
  .middleware(profileMiddleware)
  .help()
  .alias("h", "help")
  .updateStrings({ "Options:": "Global Options:" })
  .command("config", "Manage CLI configuration", (yargs) =>
    yargs
      .command("$0", "Modify configuration", {}, async (args) => {
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
        if (args.profile) {
          config.configuration.profiles = { [args.profile]: {} };
          config.credentials.profiles = { [args.profile]: {} };
        }

        const endpoint = await question(
          `Endpoint (${
            args.endpoint ?? process.env.GENAI_ENDPOINT ?? DEFAULT_ENDPOINT
          }): `
        );
        if (endpoint) {
          if (args.profile) {
            config.configuration.profiles[args.profile].endpoint = endpoint;
          } else {
            config.configuration.endpoint = endpoint;
          }
        }
        const apiKey = await question(`API Key (${args.apiKey ?? "none"}): `);
        if (apiKey) {
          if (args.profile) {
            config.credentials.profiles[args.profile].apiKey = apiKey;
          } else {
            config.credentials.apiKey = apiKey;
          }
        }

        rl.close();
        mergeConfig(config);
      })
      .command("show", "Show configuration", {}, (args) => {
        const config = loadProfileConfig(args.profile);
        prettyPrint(config);
      })
      .command("profiles", "List configuration profiles", {}, (args) => {
        const profiles = allProfiles();
        profiles.forEach((profile) => {
          console.log(profile);
        });
      })
      .command("remove", "Remove configuration", {}, (args) => {
        deleteProfileConfig(args.profile);
      })
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
  .command("files", "Upload and manage files", (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(
        "list",
        "List all files",
        groupOptions({
          purpose: {
            alias: "p",
            type: "array",
            description: "Filter listed by purpose",
            requiresArg: true,
            choices: FilePurposeSchema.options,
          },
        }),
        async (args) => {
          for await (const file of args.client.files()) {
            if (!args.purpose || args.purpose.includes(file.purpose)) {
              console.log(`${file.id} (${file.file_name})`);
            }
          }
        }
      )
      .command(
        "info <id>",
        "Show detailed information about a file",
        (yargs) =>
          yargs.positional("id", {
            type: "string",
            description: "Identifier of the file",
          }),
        async (args) => {
          const { id, file_name, purpose, created_at } = await args.client.file(
            {
              id: args.id,
            }
          );
          prettyPrint({ id, name: file_name, purpose, created_at });
        }
      )
      .command(
        "upload <file>",
        "Upload a file",
        (yargs) =>
          yargs
            .positional("file", {
              type: "string",
              describe: "Filepath to the file to be uploaded",
              normalize: true,
            })
            .options(
              groupOptions({
                purpose: {
                  alias: "p",
                  description: "Purpose of the file",
                  requiresArg: true,
                  demandOption: true,
                  choices: FilePurposeSchema.options,
                },
                name: {
                  alias: "n",
                  type: "string",
                  description: "Name of the file",
                  requiresArg: true,
                },
              })
            ),
        async (args) => {
          const { id, file_name, purpose, created_at } = await args.client.file(
            {
              purpose: args.purpose,
              filename: args.name ?? path.parse(args.file).base,
              file: createReadStream(args.file),
            }
          );
          prettyPrint({ id, name: file_name, purpose, created_at });
        }
      )
      .command(
        "download <id>",
        "Download a file",
        (yargs) =>
          yargs
            .positional("id", {
              type: "string",
              description: "Identifier of the file to download",
            })
            .options(
              groupOptions({
                output: {
                  alias: "o",
                  describe: "Filepath to write the file to",
                  type: "string",
                  normalize: true,
                  requiresArg: true,
                  coerce: (output) => createWriteStream(output),
                },
              })
            ),
        async (args) => {
          const { download } = await args.client.file({
            id: args.id,
          });
          const readable = await download();
          await pipeline(readable, args.output ?? stdout);
        }
      )
      .command(
        "delete <id>",
        "Delete a file",
        (yargs) =>
          yargs.positional("id", {
            type: "string",
            description: "Identifier of the file to be deleted",
          }),
        async (args) => {
          await args.client.file({ id: args.id }, { delete: true });
        }
      )
      .demandCommand(1, 1, "Please choose a command")
  )
  .command("history", "Show the history of inference (past 30 days)", (yargs) =>
    yargs.middleware(clientMiddleware).command(
      "$0",
      "Show the history of inference (past 30 days)",
      (yargs) =>
        yargs.options(
          groupOptions({
            from: {
              type: "string",
              requiresArg: true,
              coerce: parseDateTime,
              description:
                "Lower bound of the history timeframe [e.g. YYYY-MM-DD]",
            },
            to: {
              type: "string",
              requiresArg: true,
              coerce: parseDateTime,
              description:
                "Upper bound of the history timeframe [e.g. YYYY-MM-DD]",
            },
            status: {
              choices: HistoryStatusSchema.options,
              description: "Filter history by status",
            },
            origin: {
              choices: HistoryOriginSchema.options,
              description: "Filter history by origin",
            },
          })
        ),
      async (args) => {
        const { status, origin, from, to } = args;
        for await (const output of args.client.history({ status, origin })) {
          const createdAt = dayjs(output.created_at);
          if (
            (!from || createdAt.isAfter(from)) &&
            (!to || createdAt.isBefore(to))
          ) {
            prettyPrint(output);
          }
        }
      }
    )
  )
  .command("tunes", "Create and manage tuned models", (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command("methods", "List all tune methods", {}, async (args) => {
        const methods = await args.client.tuneMethods();
        methods.forEach((method) => {
          console.log(`${method.id} (${method.name})`);
        });
      })
      .command(
        "list",
        "List all tuned models",
        groupOptions({
          name: {
            type: "string",
            description: "Filter tuned models by name",
            requiresArg: true,
          },
        }),
        async (args) => {
          for await (const tune of args.client.tunes({ search: args.name })) {
            console.log(`${tune.id} (${tune.name})`);
          }
        }
      )
      .command(
        "info <id>",
        "Show detailed information about a tuned model",
        (yargs) =>
          yargs.positional("id", {
            type: "string",
            description: "Identifier of the tuned model",
          }),
        async (args) => {
          const { id, name } = await args.client.tune({
            id: args.id,
          });
          prettyPrint({ id, name });
        }
      )
      .command(
        "create",
        "Create a tuned model",
        (yargs) =>
          yargs
            .options(
              groupOptions({
                name: {
                  type: "string",
                  description: "Name of the tuned model",
                  requiresArg: true,
                  demandOption: true,
                },
                model: {
                  type: "string",
                  description: "Model to be tuned",
                  requiresArg: true,
                  demandOption: true,
                },
                task: {
                  description: "Tuning task",
                  requiresArg: true,
                  demandOption: true,
                  choices: ["generation", "classification", "summarization"],
                },
                method: {
                  type: "string",
                  description: "Tuning method",
                  requiresArg: true,
                  demandOption: true,
                },
                training: {
                  type: "array",
                  description: "Uploaded files to be used for training",
                  requiresArg: true,
                  demandOption: true,
                },
                validation: {
                  type: "array",
                  description: "Uploaded files to be used for validation",
                  requiresArg: true,
                },
                evaluation: {
                  type: "array",
                  description: "Uploaded files to be used for evaluation",
                  requiresArg: true,
                },
              })
            )
            .options(
              groupOptions(
                {
                  "accumulate-steps": {
                    type: "number",
                    requiresArg: true,
                    default: 16,
                    description:
                      "Number of training steps to use to combine gradients",
                  },
                  "batch-size": {
                    type: "number",
                    requiresArg: true,
                    default: 16,
                    description:
                      "Number of samples to work through before updating the internal model parameters",
                  },
                  "learning-rate": {
                    type: "number",
                    requiresArg: true,
                    default: 0.3,
                    description:
                      "Learning rate to be used while tuning prompt vectors",
                  },
                  "max-input-tokens": {
                    type: "number",
                    requiresArg: true,
                    default: 256,
                    description:
                      "Maximum number of tokens that are accepted in the input field for each example",
                  },
                  "max-output-tokens": {
                    type: "number",
                    requiresArg: true,
                    default: 128,
                    description:
                      "Maximum number of tokens that are accepted in the output field for each example",
                  },
                  "num-epochs": {
                    type: "number",
                    requiresArg: true,
                    default: 20,
                    description:
                      "The number of times to cycle through the training data set",
                  },
                  "num-virtual-tokens": {
                    type: "number",
                    requiresArg: true,
                    default: 100,
                    description:
                      "Number of virtual tokens to be used for training",
                  },
                  verbalizer: {
                    type: "string",
                    requiresArg: true,
                    description:
                      "Verbalizer template to be used for formatting data at train and inference time",
                  },
                },
                "Parameters:"
              )
            )
            .middleware((args) => {
              const parameters = pickDefined({
                accumulate_steps: args.accumulateSteps,
                batch_size: args.batchSize,
                init_method: args.initMethod,
                init_text: args.initText,
                learning_rate: args.learningRate,
                max_input_tokens: args.maxInputTokens,
                max_output_tokens: args.maxOutputTokens,
                num_epochs: args.numEpochs,
                num_virtual_tokens: args.numVirtualTokens,
                verbalizer: args.verbalizer,
              });
              args.parameters = !_.isEmpty(parameters) ? parameters : undefined;
            }),
        async (args) => {
          const { id, name } = await args.client.tune({
            name: args.name,
            model_id: args.model,
            task_id: args.task,
            method_id: args.method,
            parameters: args.parameters,
            training_file_ids: args.training,
            validation_file_ids: args.validation,
            evaluation_file_ids: args.evaluation,
          });
          prettyPrint({ id, name });
        }
      )
      .command(
        "download <asset> <id>",
        "Download assets of a completed tuned model",
        (yargs) =>
          yargs
            .positional("id", {
              type: "string",
              description: "Identifier of the tuned model",
            })
            .positional("asset", {
              describe: "Type of the asset",
              choices: TuneAssetTypeSchema.options,
            }),
        async (args) => {
          const { downloadAsset, status } = await args.client.tune({
            id: args.id,
          });
          if (status !== "COMPLETED")
            throw new BaseSDKError(
              "Only completed tunes have assets available"
            );
          const readable = await downloadAsset(args.type);
          await pipeline(readable, args.output ?? stdout);
        }
      )
      .command(
        "delete <id>",
        "Delete a tuned model",
        (yargs) =>
          yargs.positional("id", {
            type: "string",
            description: "Identifier of the tuned model",
          }),
        async (args) => {
          await args.client.tune({ id: args.id }, { delete: true });
        }
      )
      .demandCommand(1, 1, "Please choose a command")
  )
  .demandCommand(1, 1, "Please choose a command")
  .strict()
  .fail(false)
  .completion(
    "completion",
    "Generate completion script",
    (current, argv, completionFilter, done) => {
      completionFilter((err, defaultCompletions) => {
        const filteredCompletions = defaultCompletions
          .filter((completion) => !completion.startsWith("$0"))
          .filter((completion) => !completion.startsWith("completion"));
        done(filteredCompletions);
      });
    }
  );
