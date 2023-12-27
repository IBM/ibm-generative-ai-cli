import { generationCommandDefinition } from "./generation/index.js";
import { tokenizationCommandDefinition } from "./tokenization.js";
import { embeddingsCommandDefinition } from "./embeddings.js";
import { chatCommandDefinition } from "./chat.js";

export const textCommandDefinition = [
  "text",
  "Generate, tokenize, chat and embed text",
  (yargs) =>
    yargs
      .command(...generationCommandDefinition)
      .command(...tokenizationCommandDefinition)
      .command(...embeddingsCommandDefinition)
      .command(...chatCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
