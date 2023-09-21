import { allProfiles } from "../../utils/config.js";

export const profilesCommandDefinition = [
  "profiles",
  "List configuration profiles",
  {},
  () => {
    const profiles = allProfiles();
    profiles.forEach((profile) => {
      console.log(profile);
    });
  },
];
