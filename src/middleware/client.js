import { Client } from "@ibm-generative-ai/node-sdk";

import { version } from "../utils/version.js";

const agent = version ? `cli/${version}` : "cli";

export const clientMiddleware = (args) => {
  args.client = new Client({
    apiKey: args.apiKey,
    endpoint: args.endpoint,
    headers: {
      "User-Agent": agent,
      "X-Request-Origin": agent,
    },
  });
};
