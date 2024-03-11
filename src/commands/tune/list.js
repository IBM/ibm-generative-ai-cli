import { paginate } from "../../utils/paginate.js";
import { groupOptions } from "../../utils/yargs.js";

export const listCommandDefinition = [
  "list",
  "List all tuned models",
  groupOptions({
    name: {
      type: "string",
      description: "Filter tuned models by name",
      requiresArg: true,
    },
  }),
  async (args) => {
    const { name } = args;
    await paginate(async ({ offset, limit }) => {
      const { results, total_count } = await args.client.tune.list(
        {
          offset,
          limit,
          search: name,
        },
        { signal: args.timeout }
      );
      args.print(results);
      return { totalCount: total_count, itemsCount: results.length };
    });
  },
];
