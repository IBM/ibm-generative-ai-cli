#!/usr/bin/env bash

set -e

echo -n "Checking NodeJS installation ... "
if ! command -v node &> /dev/null
then
    echo "Node runtime hasn't been detected, installing via nvm"
    if command -v curl &> /dev/null
    then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    elif command -v wget &> /dev/null
    then
        wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    else
        echo "Neither curl nor wget command is present, unable to proceed"
        exit 1
    fi
else
    MINIMAL="v16.10.0"
    DETECTED=`node -v`
    echo $DETECTED
    RESULT=`node -e "console.log(\"$DETECTED\".replace('v', '').localeCompare(\"$MINIMAL\".replace('v', ''), undefined, { numeric: true }))"`
    if [ $RESULT -lt 0 ]; then
        echo "Minimal supported version is" $MINIMAL
        exit 1
    fi
fi

echo "Installing the command ..."
npm install --loglevel=error -g @ibm-generative-ai/cli

echo -n "Checking the command version ... "
if ! command genai --version
then
    echo "Failure, make sure your PATH is set up correctly"
fi
