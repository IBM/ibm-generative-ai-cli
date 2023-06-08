export const parseInput = (input) => {
  if (typeof input === "string") return input;
  else if (
    Object.hasOwn(input ?? {}, "input") &&
    typeof input.input === "string"
  )
    return input.input;
  throw new Error(
    `Invalid input, must be one of "text" or { "input": "text" }`
  );
};
