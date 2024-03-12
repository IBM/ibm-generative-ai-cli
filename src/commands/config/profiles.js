import { allProfiles } from "../../utils/config.js";

export const profilesCommandDefinition = [
  "profiles",
  "List configuration profiles",
  {},
  (args) => {
    const profiles = allProfiles();
    args.print(profiles);
  },
];
