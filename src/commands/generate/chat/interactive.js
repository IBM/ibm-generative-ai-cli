import { createInterface } from "node:readline";
import { stdin, stdout } from "node:process";
import { promisify } from "node:util";

import { isAbortError, isCancelOperationKey } from "../../../utils/common.js";

export const interactiveCommandDefinition = [
  "interactive",
  "Talk",
  (yargs) =>
    yargs.options({
      system: {
        alias: "s",
        type: "string",
        requiresArg: true,
      },
    }),
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

    const controller = new AbortController();
    ctx.abortOperation = () => controller.abort();
    const question = promisify(rl.question).bind(rl);

    let conversation_id = args.conversation;
    while (!ctx.isTerminated) {
      ctx.isProcessing = false;

      try {
        const input = await question("User> ", controller);

        ctx.isProcessing = true;
        if (input.length > 0) {
          const stream = args.client.chat(
            {
              messages: [
                {
                  role: "user",
                  content: input,
                },
              ],
              model_id: args.model ?? "default",
              parameters: args.parameters,
              conversation_id,
            },
            {
              timeout: args.timeout,
              signal: controller.signal,
              stream: true,
            }
          );

          for await (const chunk of stream) {
            conversation_id = chunk.conversation_id;
            rl.write(chunk.result.generated_text);
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
