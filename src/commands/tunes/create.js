import _ from "lodash";

import { pickDefined } from "../../utils/common.js";
import { groupOptions } from "../../utils/yargs.js";
import { prettyPrint } from "../../utils/print.js";

export const createCommandDefinition = [
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
              description: "Number of virtual tokens to be used for training",
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
  },
];
