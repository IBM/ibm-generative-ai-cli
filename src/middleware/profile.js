import { loadConfig } from "../utils/config.js";

// If profile has been selected, merge its configuration into yargs
export const profileMiddleware = (args) => {
  if (!args.profile) return;

  const { configuration, credentials } = loadConfig();
  const profileConfig = {
    ...(configuration.profiles && configuration.profiles[args.profile]),
    ...(credentials.profiles && credentials.profiles[args.profile]),
  };
  Object.entries(profileConfig).forEach(([key, value]) => {
    args[key] = value;
  });
};
