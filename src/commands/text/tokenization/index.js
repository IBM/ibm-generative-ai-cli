import { createCommandDefinition } from "./create.js";

export const tokenizationCommandDefinition = [
  "tokenization",
  "Covert text into tokens",
  (yargs) =>
    yargs
      .command(...createCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
