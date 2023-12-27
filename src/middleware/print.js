import { format } from "../utils/formatters.js";

export function printMiddleware(args) {
  args.print = (data) => console.log(format(data, args.outputFormat));
}
