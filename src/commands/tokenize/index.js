import { defaultCommandDefinition } from "./default.js";

export const tokenizeCommandDefinition = [
  "tokenize",
  "Convert provided inputs to tokens",
  (yargs) =>
    yargs
      .command(...defaultCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
