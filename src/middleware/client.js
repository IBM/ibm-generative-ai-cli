import { Client, version } from "@ibm-generative-ai/node-sdk";

export const clientMiddleware = (args) => {
  const agent = version ? `node-cli/${version}` : "node-cli";
  args.client = new Client({
    apiKey: args.apiKey,
    endpoint: args.endpoint,
    headers: {
      "User-Agent": agent,
      "X-Request-Origin": agent,
    },
  });
};
