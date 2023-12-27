import { clientMiddleware } from "../../middleware/client.js";

import { deleteCommandDefinition } from "./delete.js";
import { downloadCommandDefinition } from "./download.js";
import { infoCommandDefinition } from "./info.js";
import { listCommandDefinition } from "./list.js";
import { uploadCommandDefinition } from "./upload.js";

export const filesCommandDefinition = [
  "files",
  "Upload, download and manage files",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(...listCommandDefinition)
      .command(...infoCommandDefinition)
      .command(...uploadCommandDefinition)
      .command(...downloadCommandDefinition)
      .command(...deleteCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
