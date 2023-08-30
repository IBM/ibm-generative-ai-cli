import { allProfiles, loadProfileConfig } from "../utils/config.js";

// If profile has been selected, lazy load its configuration into yargs
export const profileMiddleware = (args) => {
  if (!args.profile) return;
  if (!allProfiles().includes(args.profile))
    throw new Error("Profile not found");
  Object.entries(loadProfileConfig(args.profile)).forEach(([key, value]) => {
    args[key] = value;
  });
};
