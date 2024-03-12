import { createCommandDefinition } from "./create.js";

export const chatCommandDefinition = [
  "chat",
  "Have a conversation",
  (yargs) =>
    yargs
      .command(...createCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
