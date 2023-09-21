import { defaultCommandDefinition } from "./default.js";
import { profilesCommandDefinition } from "./profiles.js";
import { removeCommandDefinition } from "./remove.js";
import { showCommandDefinition } from "./show.js";

export const configCommandDefinition = [
  "config",
  "Manage CLI configuration",
  (yargs) =>
    yargs
      .command(...defaultCommandDefinition)
      .command(...showCommandDefinition)
      .command(...profilesCommandDefinition)
      .command(...removeCommandDefinition),
];
