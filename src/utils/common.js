import _ from "lodash";

export const pickDefined = (obj) => _.pickBy(obj, (v) => v !== undefined);

export const isAbortError = (err) => Boolean(err && err.name === "AbortError");

export const isCancelOperationKey = (() => {
  const cancelOperationKeys = [
    // Ctrl+C
    Buffer.from([0x03]),
    // Ctrl+D
    Buffer.from([0x04]),
    // Ctrl+Z
    Buffer.from([0x1a]),
  ];

  return (buf) =>
    Buffer.isBuffer(buf) &&
    cancelOperationKeys.some((key) => Buffer.compare(key, buf) === 0);
})();
