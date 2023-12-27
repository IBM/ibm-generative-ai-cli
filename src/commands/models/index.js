import { clientMiddleware } from "../../middleware/client.js";

import { infoCommandDefinition } from "./info.js";
import { listCommandDefinition } from "./list.js";

export const modelsCommandDefinition = [
  "models",
  "Show information about available models",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(...listCommandDefinition)
      .command(...infoCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
