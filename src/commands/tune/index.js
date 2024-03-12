import { clientMiddleware } from "../../middleware/client.js";

import { createCommandDefinition } from "./create.js";
import { deleteCommandDefinition } from "./delete.js";
import { readCommandDefiniton } from "./read.js";
import { retrieveCommandDefinition } from "./retrieve.js";
import { listCommandDefinition } from "./list.js";
import { typesCommandDefinition } from "./types.js";

export const tuneCommandDefinition = [
  "tune",
  "Train and manage tuned models",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(...createCommandDefinition)
      .command(...retrieveCommandDefinition)
      .command(...readCommandDefiniton)
      .command(...deleteCommandDefinition)
      .command(...listCommandDefinition)
      .command(...typesCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
