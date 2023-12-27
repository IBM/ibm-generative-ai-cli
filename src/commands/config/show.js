import { loadProfileConfig } from "../../utils/config.js";

export const showCommandDefinition = [
  "show",
  "Show configuration",
  {},
  (args) => {
    const config = loadProfileConfig(args.profile);
    args.print(config);
  },
];
