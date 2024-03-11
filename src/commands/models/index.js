import { clientMiddleware } from "../../middleware/client.js";

import { retrieveCommandDefinition } from "./retrieve.js";
import { listCommandDefinition } from "./list.js";

export const modelsCommandDefinition = [
  "model",
  "Show information about available models",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(...listCommandDefinition)
      .command(...retrieveCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
