import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

import { DEFAULT_ENDPOINT } from "../../utils/constants.js";
import { mergeConfig } from "../../utils/config.js";
import { isValidFormat } from "../../utils/formatters.js";

export const defaultCommandDefinition = [
  "$0",
  "Modify configuration",
  {},
  async (args) => {
    const rl = createInterface({
      input: stdin,
      output: stdout,
    });
    const question = promisify(rl.question).bind(rl);
    rl.on("close", () => {
      console.log();
    });

    const config = {
      configuration: {},
      credentials: {},
    };
    if (args.profile) {
      config.configuration.profiles = { [args.profile]: {} };
      config.credentials.profiles = { [args.profile]: {} };
    }

    const endpoint = await question(
      `Endpoint (${
        args.endpoint ?? process.env.GENAI_ENDPOINT ?? DEFAULT_ENDPOINT
      }): `
    );
    if (endpoint) {
      if (args.profile) {
        config.configuration.profiles[args.profile].endpoint = endpoint;
      } else {
        config.configuration.endpoint = endpoint;
      }
    }
    const apiKey = await question(`API Key (${args.apiKey ?? "none"}): `);
    if (apiKey) {
      if (args.profile) {
        config.credentials.profiles[args.profile].apiKey = apiKey;
      } else {
        config.credentials.apiKey = apiKey;
      }
    }
    const outputFormat = await question(
      `Default output format [choices: "json", "yaml"] (${
        args.outputFormat ?? "none"
      }): `
    );
    if (outputFormat && isValidFormat(outputFormat)) {
      if (args.profile) {
        config.configuration.profiles[args.profile]["output-format"] =
          outputFormat;
      } else {
        config.configuration["output-format"] = outputFormat;
      }
    }

    rl.close();
    mergeConfig(config);
  },
];
