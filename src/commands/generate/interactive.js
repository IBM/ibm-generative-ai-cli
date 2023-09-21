import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { promisify } from "node:util";

import { isAbortError, isCancelOperationKey } from "../../utils/common.js";

export const interactiveCommandDefinition = [
  "interactive",
  "Interactive context-free generate session",
  {},
  async (args) => {
    if (args.parameters?.stream === false) {
      throw new Error("Stream is automatically enabled for interactive mode.");
    }

    const ctx = {
      isTerminated: false,
      isProcessing: false,
      abortOperation: () => {},
    };

    const onUserActionCancel = () => {
      ctx.abortOperation();
      if (!ctx.isProcessing) {
        ctx.isTerminated = true;
      }
    };

    const rl = createInterface({
      input: new Proxy(stdin, {
        get(target, prop) {
          if (prop === "on" || prop === "addEventListener") {
            return (event, handler) => {
              if (event === "data") {
                const originalHandler = handler;
                handler = (chunk) => {
                  if (!ctx.isProcessing || isCancelOperationKey(chunk)) {
                    originalHandler(chunk);
                  }
                };
              }
              return target.on(event, handler);
            };
          }
          return target[prop];
        },
      }),
      output: stdout,
      prompt: "",
    })
      .on("SIGINT", onUserActionCancel)
      .on("SIGTSTP", onUserActionCancel)
      .on("SIGCONT", onUserActionCancel)
      .on("history", (history) => {
        if (ctx.isProcessing) {
          history.shift();
        }
      });

    while (!ctx.isTerminated) {
      ctx.isProcessing = false;

      try {
        const controller = new AbortController();
        ctx.abortOperation = () => controller.abort();

        const question = promisify(rl.question).bind(rl);
        const input = await question("GenAI> ", controller);

        ctx.isProcessing = true;
        if (input.length > 0) {
          const stream = args.client.generate(
            {
              input: input,
              model_id: args.model ?? "default",
              parameters: args.parameters,
            },
            {
              timeout: args.timeout,
              signal: controller.signal,
              stream: true,
            }
          );

          for await (const chunk of stream) {
            rl.write(chunk.generated_text);
          }
          rl.write("\n");
        }
      } catch (err) {
        if (isAbortError(err)) {
          // Clear line due to broken cursor
          rl.write("\n");
          rl.write(null, { ctrl: true, name: "u" });
        } else {
          console.error(err.message);
        }
      }
    }

    rl.write("Goodbye");
    rl.write("\n");
    rl.close();
  },
];
