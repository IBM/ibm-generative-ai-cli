import { allProfiles, loadProfileConfig } from "../utils/config.js";

// If profile has been selected, lazy load its configuration into yargs
export function profileMiddleware(args) {
  if (!args.profile) return;
  if (!allProfiles().includes(args.profile)) {
    if (args._.length === 1 && args._[0] === "config") return; // Only create config command can pass
    throw new Error("Profile not found");
  }
  Object.entries(loadProfileConfig(args.profile)).forEach(([key, value]) => {
    args[key] = value;
  });
}
