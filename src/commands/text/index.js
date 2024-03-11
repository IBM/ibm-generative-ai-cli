import { generationCommandDefinition } from "./generation/index.js";
import { tokenizationCommandDefinition } from "./tokenization/index.js";
import { chatCommandDefinition } from "./chat/index.js";

export const textCommandDefinition = [
  "text",
  "Text generation, tokenization and chat services",
  (yargs) =>
    yargs
      .command(...generationCommandDefinition)
      .command(...tokenizationCommandDefinition)
      .command(...chatCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
