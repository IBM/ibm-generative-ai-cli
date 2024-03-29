# IBM Generative AI CLI (Tech Preview)

This is not the [watsonx.ai](https://www.ibm.com/products/watsonx-ai) CLI. This is the CLI for the Tech Preview program for IBM Foundation Models Studio.
You can start a trial version or request a demo via https://www.ibm.com/products/watsonx-ai.

This project provides convenient access to the Generative AI API from the command line. For a full description of the API, please visit the [Generative AI API Documentation](https://bam.res.ibm.com/docs/api-reference).

_Are you looking for an SDK?<br>
If so, check out the [NodeJS SDK](https://github.com/IBM/ibm-generative-ai-node-sdk) and [Python SDK](https://github.com/IBM/ibm-generative-ai)._

![-----------------------------------------------------](./assets/img/rainbow.png)

## Table of contents

- [Key Features](#key-features)
- [Installation](#installation)
- [Usage](#usage)

![-----------------------------------------------------](./assets/img/rainbow.png)

## Key features

- ⚡️ Performant - processes 1k of short inputs in under a minute
- ☀️ Fault-tolerant - retry strategies and overflood protection
- 🏖️ Worry-free parallel processing - just pass all the data, we take care of the parallel processing
- 🚦 Handles concurrency limiting - even if you have multiple parallel jobs running
- ⏩ Requests are always returned in the respective order
- ⌨️ Support stdin and stdout interaction

![-----------------------------------------------------](./assets/img/rainbow.png)

## Installation

The CLI is distributed as an [npm](https://www.npmjs.com/package/@ibm-generative-ai/cli) package. [NodeJS](https://nodejs.org) runtime with sufficient version is required.

### Script

Preferred way of installing the CLI is the install script. If NodeJS is not detected, it is installed via [nvm](https://github.com/nvm-sh/nvm).

```bash
source <(curl -sSL https://raw.githubusercontent.com/IBM/ibm-generative-ai-cli/main/install.sh)
```

```bash
source <(wget -qO- https://raw.githubusercontent.com/IBM/ibm-generative-ai-cli/main/install.sh)
```

### NPM

The CLI can also be installed directly using npm:

```bash
npm install -g @ibm-generative-ai/cli
```

## Configuration

Create default configuration:

```bash
genai config
```

One can also create profile-specific configuration:

```bash
genai --profile joe config
```

All the commands executed with `--profile joe` argument will use that configuration (and default as a fallback).

### Autocompletion

The full commands have many segments due to alignment with the SDK and REST API. The CLI works best with autocompletion. Run the following to activate autocompletion, replace `.zshrc` with the configuration file of your shell:

```bash
genai completion >> ~/.zshrc
source ~/.zshrc
```

### Output format

You can choose default output format during `genai config` or set it via `--output-format` flag. Choices are `json` and `yaml`. Former can be piped into [jq](https://jqlang.github.io/jq/) for further processing. Default is `json`.

### Many inputs

Certain commands (e.g. `text generation create` or `text tokenization create`) accept inputs from `stdin` if positional arguments are omitted. The content of `stdin` MUST follow [JSONL](https://jsonlines.org/) format.

```bash
cat inputs.jsonl
# "foo"
# "bar"
# "baz"
cat inputs.jsonl moreInputs.jsonl | genai text generation create -m google/flan-ul2 | jq '.results[0].generated_text'
```

## Commands

```bash
$ genai --help
genai <command>

Commands:
  genai config      Manage CLI configuration
  genai text        Text generation, tokenization and chat services
  genai model       Available models
  genai file        Upload, download and manage files
  genai request     Request history (for the past 30 days)
  genai tune        Train and manage tuned models
  genai completion  Generate completion script
```
