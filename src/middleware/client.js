import { Client } from "@ibm-generative-ai/node-sdk";

// eslint-disable-next-line import/namespace
import { version } from "../utils/version.js";

export const clientMiddleware = (args) => {
  const agent = version ? `cli/${version}` : "cli";
  args.client = new Client({
    apiKey: args.apiKey,
    endpoint: args.endpoint,
    headers: {
      "User-Agent": agent,
      "X-Request-Origin": agent,
    },
  });
};
