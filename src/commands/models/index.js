import { clientMiddleware } from "../../middleware/client.js";

import { infoCommandDefinition } from "./info.js";
import { listCommandDefinition } from "./list.js";
import { schemaCommandDefinition } from "./schema.js";

export const modelsCommandDefinition = [
  "models",
  "Show information about available models",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(...listCommandDefinition)
      .command(...infoCommandDefinition)
      .command(...schemaCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
