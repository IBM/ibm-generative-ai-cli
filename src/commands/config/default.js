import { stdin, stdout } from "node:process";
import { createInterface } from "node:readline";
import { promisify } from "node:util";

import { DEFAULT_ENDPOINT } from "../../utils/constants.js";
import { mergeConfig } from "../../utils/config.js";

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

    rl.close();
    mergeConfig(config);
  },
];
