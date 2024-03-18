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
      const output = await args.client.file.list(
        {
          offset,
          limit,
          purpose,
        },
        { signal: args.timeout }
      );
      args.print(output);
      return {
        totalCount: output.totalCount,
        itemsCount: output.results.length,
      };
    });
  },
];
