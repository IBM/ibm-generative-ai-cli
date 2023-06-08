import YAML from "yaml";

export const prettyPrint = (value) => console.log(YAML.stringify(value));
