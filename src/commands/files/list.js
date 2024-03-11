import { paginate } from "../../utils/paginate.js";
import { groupOptions } from "../../utils/yargs.js";

export const listCommandDefinition = [
  "list",
  "List all files",
  groupOptions({
    purpose: {
      alias: "p",
      type: "array",
      description: "Filter listed by purpose",
      requiresArg: true,
    },
  }),
  async (args) => {
    const { purpose } = args;
    await paginate(async ({ offset, limit }) => {
      const { results, total_count } = await args.client.file.list({
        offset,
        limit,
        purpose,
      });
      args.print(results);
      return { totalCount: total_count, itemsCount: results.length };
    });
  },
];
