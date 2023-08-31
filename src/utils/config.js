import os from "os";
import path from "path";
import fs, { writeFileSync } from "fs";

import YAML from "yaml";
import _ from "lodash";
import { z } from "zod";

const CONFIG_DIR_PATH = path.join(os.homedir(), ".genai");
const CONFIG_PATH = path.join(CONFIG_DIR_PATH, "configuration.yml");
// Credentials and their storage are defined by the Node SDK. Currently, the SDK doesn't expose any utilities to manage them.
const CREDENTIALS_PATH = path.join(CONFIG_DIR_PATH, "credentials.yml");

const configurationSchema = z
  .object({
    endpoint: z.string(), // default profile
    profiles: z.record(
      z
        .object({
          endpoint: z.string(),
        })
        .partial()
    ),
  })
  .partial();

const credentialsSchema = z
  .object({
    apiKey: z.string(), // default profile
    profiles: z.record(
      z
        .object({
          apiKey: z.string(),
        })
        .partial()
    ),
  })
  .partial();

const parseYamlFromFile = (path) =>
  fs.existsSync(path) ? YAML.parse(fs.readFileSync(path, "utf8")) : {};

let cachedConfig = null;
export const loadConfig = () => {
  if (cachedConfig) return cachedConfig;
  cachedConfig = {};
  try {
    cachedConfig.configuration = configurationSchema.parse(
      parseYamlFromFile(CONFIG_PATH)
    );
  } catch (err) {
    cachedConfig = null;
    throw new Error(
      `Failed to load the configuration, patch or remove ${CONFIG_PATH}\nDetails: ${YAML.stringify(
        err.format()
      )}`
    );
  }
  try {
    cachedConfig.credentials = credentialsSchema.parse(
      parseYamlFromFile(CREDENTIALS_PATH)
    );
  } catch (err) {
    cachedConfig = null;
    throw new Error(
      `Failed to load credentials, patch or remove ${CREDENTIALS_PATH}\nDetails: ${YAML.stringify(
        err.format()
      )}`
    );
  }
  return cachedConfig;
};

export const storeConfig = (config) => {
  if (!fs.existsSync(CONFIG_DIR_PATH)) {
    fs.mkdirSync(CONFIG_DIR_PATH);
  }
  writeFileSync(CONFIG_PATH, YAML.stringify(config.configuration ?? {}));
  writeFileSync(CREDENTIALS_PATH, YAML.stringify(config.credentials ?? {}));
  cachedConfig = config;
};

export const mergeConfig = (config) => {
  const currentConfig = loadConfig();
  storeConfig(_.merge({}, currentConfig, config));
};

export function loadProfileConfig(profile) {
  const { configuration, credentials } = loadConfig();
  const profileConfig = {
    ...configuration,
    ...(profile && configuration.profiles && configuration.profiles[profile]),
    ...credentials,
    ...(profile && credentials.profiles && credentials.profiles[profile]),
  };
  delete profileConfig.profiles;
  return profileConfig;
}

export function deleteProfileConfig(profile) {
  const config = _.cloneDeep(loadConfig());
  if (profile) {
    [config.configuration.profiles, config.credentials.profiles].forEach(
      (profiles) => {
        if (profiles) {
          delete profiles[profile];
        }
      }
    );
    storeConfig(config);
  } else {
    storeConfig({
      configuration: _.pick(config.configuration, "profiles"),
      credentials: _.pick(config.credentials, "profiles"),
    });
  }
}

export function allProfiles() {
  const config = loadConfig();
  return Object.keys({
    ...config.configuration.profiles,
    ...config.credentials.profiles,
  });
}
