import { clientMiddleware } from "../../middleware/client.js";

import { defaultCommandDefinition } from "./default.js";

export const historyCommandDefinition = [
  "history",
  "Show the history of inference (past 30 days)",
  (yargs) =>
    yargs.middleware(clientMiddleware).command(...defaultCommandDefinition),
];
