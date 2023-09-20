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
    for await (const tune of args.client.tunes({ search: args.name })) {
      console.log(`${tune.id} (${tune.name})`);
    }
  },
];
