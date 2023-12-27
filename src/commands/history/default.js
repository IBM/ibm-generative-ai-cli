import {
  HistoryOriginSchema,
  HistoryStatusSchema,
} from "@ibm-generative-ai/node-sdk";
import dayjs from "dayjs";

import { parseDateTime } from "../../utils/parsers.js";
import { groupOptions } from "../../utils/yargs.js";

export const defaultCommandDefinition = [
  "$0",
  "Show the history of inference (past 30 days)",
  (yargs) =>
    yargs.options(
      groupOptions({
        from: {
          type: "string",
          requiresArg: true,
          coerce: parseDateTime,
          description: "Lower bound of the history timeframe [e.g. YYYY-MM-DD]",
        },
        to: {
          type: "string",
          requiresArg: true,
          coerce: parseDateTime,
          description: "Upper bound of the history timeframe [e.g. YYYY-MM-DD]",
        },
        status: {
          choices: HistoryStatusSchema.options,
          description: "Filter history by status",
        },
        origin: {
          choices: HistoryOriginSchema.options,
          description: "Filter history by origin",
        },
      })
    ),
  async (args) => {
    const { status, origin, from, to } = args;
    for await (const output of args.client.history({ status, origin })) {
      const createdAt = dayjs(output.created_at);
      if (
        (!from || createdAt.isAfter(from)) &&
        (!to || createdAt.isBefore(to))
      ) {
        args.print(output);
      }
    }
  },
];
