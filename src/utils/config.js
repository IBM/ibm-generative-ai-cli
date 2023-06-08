import os from "os";
import path from "path";
import fs, { writeFileSync } from "fs";

import YAML from "yaml";
import _ from "lodash";

const CONFIG_DIR_PATH = path.join(os.homedir(), ".genai");
const CONFIG_PATH = path.join(CONFIG_DIR_PATH, "configuration.yml");
// Credentials and their storage are defined by the Node SDK. Currently, the SDK doesn't expose any utilities to manage them.
const CREDENTIALS_PATH = path.join(CONFIG_DIR_PATH, "credentials.yml");

export const loadConfig = () => {
  const parseYamlFromFile = (path) =>
    fs.existsSync(path) ? YAML.parse(fs.readFileSync(path, "utf8")) : {};
  return {
    configuration: parseYamlFromFile(CONFIG_PATH),
    credentials: parseYamlFromFile(CREDENTIALS_PATH),
  };
};

export const storeConfig = (config) => {
  if (!fs.existsSync(CONFIG_DIR_PATH)) {
    fs.mkdirSync(CONFIG_DIR_PATH);
  }
  writeFileSync(CONFIG_PATH, YAML.stringify(config.configuration ?? {}));
  writeFileSync(CREDENTIALS_PATH, YAML.stringify(config.credentials ?? {}));
};

export const mergeConfig = (config) => {
  const currentConfig = loadConfig();
  storeConfig(_.merge({}, currentConfig, config));
};
