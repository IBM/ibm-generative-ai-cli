import { clientMiddleware } from "../../middleware/client.js";

import { deleteCommandDefinition } from "./delete.js";
import { readCommandDefinition } from "./read.js";
import { retrieveCommandDefinition } from "./retrieve.js";
import { listCommandDefinition } from "./list.js";
import { createCommandDefinition } from "./create.js";

export const filesCommandDefinition = [
  "file",
  "Upload, download and manage files",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(...createCommandDefinition)
      .command(...retrieveCommandDefinition)
      .command(...readCommandDefinition)
      .command(...deleteCommandDefinition)
      .command(...listCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
