import { loadProfileConfig } from "../../utils/config.js";
import { prettyPrint } from "../../utils/print.js";

export const showCommandDefinition = [
  "show",
  "Show configuration",
  {},
  (args) => {
    const config = loadProfileConfig(args.profile);
    prettyPrint(config);
  },
];
