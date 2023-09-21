import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { profileMiddleware } from "./middleware/profile.js";
import { generateCommandDefinition } from "./commands/generate/index.js";
import { modelsCommandDefinition } from "./commands/models/index.js";
import { tokenizeCommandDefinition } from "./commands/tokenize/index.js";
import { filesCommandDefinition } from "./commands/files/index.js";
import { historyCommandDefinition } from "./commands/history/index.js";
import { tunesCommandDefinition } from "./commands/tunes/index.js";
import { configCommandDefinition } from "./commands/config/index.js";

export const parser = yargs(hideBin(process.argv))
  .options({
    endpoint: {
      describe: "Provide custom endpoint",
      defaultDescription: "GENAI_ENDPOINT or config",
      requiresArg: true,
      type: "string",
    },
    apiKey: {
      alias: "k",
      describe: "Provide your api key",
      defaultDescription: "GENAI_API_KEY or config",
      requiresArg: true,
      type: "string",
    },
    timeout: {
      describe: "Request timeout in milliseconds",
      requiresArg: true,
      type: "number",
      defaultDescription: "none",
    },
    profile: {
      describe: "Use a specific profile from your configuration",
      requiresArg: true,
      type: "string",
    },
  })
  .middleware(profileMiddleware)
  .help()
  .alias("h", "help")
  .updateStrings({ "Options:": "Global Options:" })
  .command(...configCommandDefinition)
  .command(...generateCommandDefinition)
  .command(...modelsCommandDefinition)
  .command(...tokenizeCommandDefinition)
  .command(...filesCommandDefinition)
  .command(...historyCommandDefinition)
  .command(...tunesCommandDefinition)
  .demandCommand(1, 1, "Please choose a command")
  .strict()
  .fail(false)
  .completion(
    "completion",
    "Generate completion script",
    (current, argv, completionFilter, done) => {
      completionFilter((err, defaultCompletions) => {
        const filteredCompletions = defaultCompletions
          .filter((completion) => !completion.startsWith("$0"))
          .filter((completion) => !completion.startsWith("completion"));
        done(filteredCompletions);
      });
    }
  );
