import { clientMiddleware } from "../../middleware/client.js";

import { listCommandDefinition } from "./list.js";

export const requestCommandDefinition = [
  "request",
  "Request history (for the past 30 days)",
  (yargs) =>
    yargs
      .middleware(clientMiddleware)
      .command(...listCommandDefinition)
      .demandCommand(1, 1, "Please choose a command"),
];
