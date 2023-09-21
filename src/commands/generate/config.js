import isEmpty from "lodash/isEmpty.js";
import merge from "lodash/merge.js";

import { pickDefined } from "../../utils/common.js";
import { prettyPrint } from "../../utils/print.js";
import { groupOptions } from "../../utils/yargs.js";

export const configCommandDefinition = [
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
              description: "Include the list of individual generated tokens",
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
        args.parameters = !isEmpty(return_options)
          ? merge({}, args.parameters, { return_options })
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
  },
];
