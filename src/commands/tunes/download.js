import { stdout } from "node:process";
import { pipeline } from "node:stream/promises";

import {
  BaseError as BaseSDKError,
  TuneAssetTypeSchema,
} from "@ibm-generative-ai/node-sdk";

export const downloadCommandDefiniton = [
  "download <asset> <id>",
  "Download assets of a completed tuned model",
  (yargs) =>
    yargs
      .positional("id", {
        type: "string",
        description: "Identifier of the tuned model",
      })
      .positional("asset", {
        describe: "Type of the asset",
        choices: TuneAssetTypeSchema.options,
      }),
  async (args) => {
    const { downloadAsset, status } = await args.client.tune({
      id: args.id,
    });
    if (status !== "COMPLETED")
      throw new BaseSDKError("Only completed tunes have assets available");
    const readable = await downloadAsset(args.type);
    await pipeline(readable, args.output ?? stdout);
  },
];
