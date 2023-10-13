# IBM Generative AI CLI (Tech Preview)

This is not the [watsonx.ai](https://www.ibm.com/products/watsonx-ai) CLI. This is the CLI for the Tech Preview program for IBM Foundation Models Studio.
You can start a trial version or request a demo via https://www.ibm.com/products/watsonx-ai.

This project provides convenient access to the Generative AI API from the command line. For a full description of the API, please visit the [Generative AI API Documentation](https://workbench.res.ibm.com/docs/api-reference).

![demo](./assets/img/demo.gif)

_Are you looking for an SDK?<br>
If so, check out the [NodeJS SDK](https://github.com/IBM/ibm-generative-ai-node-sdk) and [Python SDK](https://github.com/IBM/ibm-generative-ai)._

![-----------------------------------------------------](./assets/img/rainbow.png)

## Table of contents

- [Key Features](#key-features)
- [Installation](#installation)
- [Usage](#usage)

![-----------------------------------------------------](./assets/img/rainbow.png)

## Key features

- ⚡️ Performant - processes 1k of short inputs in about 4 minutes
- ☀️ Fault-tolerant - retry strategies and overflood protection
- 🏖️ Worry-free parallel processing - just pass all the data, we take care of the parallel processing
- 🚦 Handles concurrency limiting - even if you have multiple parallel jobs running
- ⏩ Requests are always returned in the respective order
- 📄 Work with files as your input or output
- ⌨️ Support stdin and stdout interaction
- 🕹️ Interactive context-free mode

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

## Usage

```bash
# Run single generate request:
genai generate "Once upon a time there lived a rabbit"
# " called Edward. He lived well because he had some things to eat. He had a wife called Daisy"

# Run multiple generate requests from a file:
# "Best Christmas gift for dad: "
# "Best Christmas gift for mum: "
# "Best Christmas gift for dog: "
genai generate -f inputs.txt
# "a new wallet"
# "a day out"
# "a bone"

# Run tokenize request:
genai tokenize "This is a future."
# {"token_count":5,"tokens":["This", "is", "a", "future", "."]}

# Retrieve generate config
genai generate config
# model_id: google/flan-ul2,
# parameters:
#   max_new_tokens: 1,
#   decoding_method: greedy
#

# Update generate config
genai generate config -m google/flan-ul2 --decoding-method greedy --max-new-tokens 5 --min-new-tokens 1

# Enter interactive mode
genai generate interactive

# List models
genai models list
# google/flan-t5-xxl
# google/flan-ul2
# ...

# Show model details
genai models info google/flan-ul2
# id: google/flan-ul2
# name: flan-ul2 (20B)
# size: 20B
# description: >-
#   flan-ul2 (20B) is an encoder decoder model ...
```
