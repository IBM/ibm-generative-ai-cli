import YAML from "yaml";

const formats = ["json", "yaml"];

export function isValidFormat(format) {
  return formats.includes(format);
}

export function format(data, format) {
  if (!isValidFormat(format)) new Error("Invalid format");
  switch (format) {
    case "json":
      return JSON.stringify(data);
    case "yaml":
      return YAML.stringify(data);
  }
}
