import { paginate } from "../../utils/paginate.js";
import { groupOptions } from "../../utils/yargs.js";

export const listCommandDefinition = [
  "list",
  "List available models",
  (yargs) =>
    yargs.options(
      groupOptions({
        type: {
          type: "string",
          choices: ["model", "tune"],
        },
      })
    ),
  async (args) => {
    await paginate(async ({ offset, limit }) => {
      const output = await args.client.model.list(
        {
          type: args.type,
          offset,
          limit,
        },
        { signal: args.timeout }
      );
      args.print(output);
      return {
        totalCount: output.total_count,
        itemsCount: output.results.length,
      };
    });
  },
];
