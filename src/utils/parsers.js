import dayjs from "dayjs";

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

export const parseDateTime = (datetime) => {
  const parsedDateTime = dayjs(datetime);
  if (!parsedDateTime.isValid())
    throw new Error(`${datetime} is not a valid date`);
  return parsedDateTime;
};
