import { defaultCommandDefinition } from "./default.js";
import { interactiveCommandDefinition } from "./interactive.js";

export const chatCommandDefinition = [
  "chat",
  "Start or continue a conversation",
  (yargs) =>
    yargs
      .command(...defaultCommandDefinition)
      .command(...interactiveCommandDefinition),
];
