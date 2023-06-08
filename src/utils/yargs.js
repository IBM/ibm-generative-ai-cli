export const groupOptions = (options, groupName = "Options:") => {
  Object.values(options).forEach((opt) => (opt.group = groupName));
  return options;
};
