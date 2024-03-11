import { createCommandDefinition } from "./create.js";

export const chatCommandDefinition = [
  "chat",
  "Chat with a selected model",
  (yargs) =>
    yargs
      .command(...createCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
