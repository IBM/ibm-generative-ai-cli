import yargs from "yargs";
import { hideBin } from "yargs/helpers";

import { profileMiddleware } from "./middleware/profile.js";
import { textCommandDefinition } from "./commands/text/index.js";
import { modelsCommandDefinition } from "./commands/models/index.js";
import { filesCommandDefinition } from "./commands/files/index.js";
import { requestCommandDefinition } from "./commands/request/index.js";
import { tuneCommandDefinition } from "./commands/tune/index.js";
import { configCommandDefinition } from "./commands/config/index.js";
import { printMiddleware } from "./middleware/print.js";

export const parser = yargs(hideBin(process.argv))
  .options({
    "endpoint": {
      describe: "Provide custom endpoint",
      defaultDescription: "GENAI_ENDPOINT or config",
      requiresArg: true,
      type: "string",
    },
    "apiKey": {
      alias: "k",
      describe: "Provide your api key",
      defaultDescription: "GENAI_API_KEY or config",
      requiresArg: true,
      type: "string",
    },
    "timeout": {
      describe: "Request timeout in milliseconds",
      requiresArg: true,
      type: "number",
      defaultDescription: "none",
      coerce: (timeout) => AbortSignal.timeout(timeout),
    },
    "profile": {
      describe: "Use a specific profile from your configuration",
      requiresArg: true,
      type: "string",
    },
    "output-format": {
      type: "string",
      choice: ["json", "yaml"],
      default: "json",
      describe: "Output format",
    },
  })
  .middleware(printMiddleware)
  .middleware(profileMiddleware)
  .help()
  .alias("h", "help")
  .updateStrings({ "Options:": "Global Options:" })
  .command(...configCommandDefinition)
  .command(...textCommandDefinition)
  .command(...modelsCommandDefinition)
  .command(...filesCommandDefinition)
  .command(...requestCommandDefinition)
  .command(...tuneCommandDefinition)
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
