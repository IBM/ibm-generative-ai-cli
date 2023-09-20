import { clientMiddleware } from "../../middleware/client.js";

import { createCommandDefinition } from "./create.js";
import { deleteCommandDefinition } from "./delete.js";
import { downloadCommandDefiniton } from "./download.js";
import { infoCommandDefinition } from "./info.js";
import { listCommandDefinition } from "./list.js";
import { methodsCommandDefinition } from "./methods.js";

export const tunesCommandDefinition = [
  "tunes",
  "Create and manage tuned models",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(...methodsCommandDefinition)
      .command(...listCommandDefinition)
      .command(...infoCommandDefinition)
      .command(...createCommandDefinition)
      .command(...downloadCommandDefiniton)
      .command(...deleteCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
