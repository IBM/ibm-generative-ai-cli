#!/usr/bin/env node

import { parser } from "./parser.js";
import { isUsageError } from "./errors.js";
import { loadYargsConfig } from "./utils/config.js";

try {
  await parser.config(loadYargsConfig()).parse();
} catch (err) {
  if (isUsageError(err)) {
    parser.showHelp();
  }
  console.error(err.message || "Something went wrong");
  parser.exit(1);
}
