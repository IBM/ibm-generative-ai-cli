import { deleteProfileConfig } from "../../utils/config.js";

export const removeCommandDefinition = [
  "remove",
  "Remove configuration",
  {},
  (args) => {
    deleteProfileConfig(args.profile);
  },
];
