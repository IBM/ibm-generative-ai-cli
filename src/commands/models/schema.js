import { prettyPrint } from "../../utils/print.js";

export const schemaCommandDefinition = [
  "schema <model>",
  "Show validation schema for a model",
  {
    type: {
      alias: "t",
      describe: "Type of the schema to show",
      demandOption: true,
      choices: ["generate", "tokenize"],
      requiresArg: true,
      type: "string",
    },
    model: {
      type: "string",
    },
  },
  async (args) => {
    const { schema_generate, schema_tokenize } = await args.client.model({
      id: args.model,
    });

    if (args.type === "generate") prettyPrint(schema_generate.value);
    else if (args.type === "tokenize") prettyPrint(schema_tokenize.value);
  },
];
