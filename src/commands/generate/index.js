import _ from "lodash";

import { clientMiddleware } from "../../middleware/client.js";
import { pickDefined } from "../../utils/common.js";
import { groupOptions } from "../../utils/yargs.js";

import { interactiveCommandDefinition } from "./interactive.js";
import { configCommandDefinition } from "./config.js";
import { defaultCommandDefinition } from "./default.js";

export const generateCommandDefinition = [
  "generate",
  "Generate a text from an input text",
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
      .command(...defaultCommandDefinition)
      .command(...interactiveCommandDefinition)
      .command(...configCommandDefinition)
      .example('$0 generate "Hello World"', "Supply single input")
      .example("$0 generate -f inputs.jsonl", "Supply JSONL file with inputs")
      .example(
        "$0 generate config -m google/flan-t5-xxl --random-seed 2",
        "Modify generate configuration with a given model and parameters"
      )
      .demandCommand(1, 1, "Please choose a command"),
];
