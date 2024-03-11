import { paginate } from "../../utils/paginate.js";
import { groupOptions } from "../../utils/yargs.js";

export const listCommandDefinition = [
  "list",
  "List history of requests",
  (yargs) =>
    yargs.options(
      groupOptions({
        from: {
          type: "string",
          requiresArg: true,
          description: "Lower bound of the history timeframe [e.g. YYYY-MM-DD]",
        },
        to: {
          type: "string",
          requiresArg: true,
          description: "Upper bound of the history timeframe [e.g. YYYY-MM-DD]",
        },
        status: {
          description: "Filter history by status",
        },
        origin: {
          description: "Filter history by origin",
        },
      })
    ),
  async (args) => {
    const { status, origin, from, to } = args;
    await paginate(async ({ offset, limit }) => {
      const { results, total_count } = await args.client.request.list(
        {
          offset,
          limit,
          status,
          origin,
          from,
          to,
        },
        { signal: args.timeout }
      );
      args.print(results);
      return { totalCount: total_count, itemsCount: results.length };
    });
  },
];
