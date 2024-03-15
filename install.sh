#!/usr/bin/env bash

# Source: nvm (project)
try_profile() {
  if [ -z "${1-}" ] || [ ! -f "${1}" ]; then
    return 1
  fi
  echo "${1}"
}

# Source: nvm (project)
detect_profile() {
  if [ -n "${PROFILE}" ] && [ -f "${PROFILE}" ]; then
    echo "${PROFILE}"
    return
  fi

  local DETECTED_PROFILE
  DETECTED_PROFILE=''

  if [ "${SHELL#*bash}" != "$SHELL" ]; then
    if [ -f "$HOME/.bashrc" ]; then
      DETECTED_PROFILE="$HOME/.bashrc"
    elif [ -f "$HOME/.bash_profile" ]; then
      DETECTED_PROFILE="$HOME/.bash_profile"
    fi
  elif [ "${SHELL#*zsh}" != "$SHELL" ]; then
    if [ -f "$HOME/.zshrc" ]; then
      DETECTED_PROFILE="$HOME/.zshrc"
    elif [ -f "$HOME/.zprofile" ]; then
      DETECTED_PROFILE="$HOME/.zprofile"
    fi
  fi

  if [ -z "$DETECTED_PROFILE" ]; then
    for EACH_PROFILE in ".PROFILE_PATH" ".bashrc" ".bash_profile" ".zprofile" ".zshrc"
    do
      if DETECTED_PROFILE="$(try_profile "${HOME}/${EACH_PROFILE}")"; then
        break
      fi
    done
  fi

  if [ -n "$DETECTED_PROFILE" ]; then
    echo "$DETECTED_PROFILE"
  fi
}

echo -n "Checking NodeJS installation ... "
if ! command -v node &> /dev/null
then
    echo "Node runtime hasn't been detected, installing via nvm."
    if command -v curl &> /dev/null
    then
        curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    elif command -v wget &> /dev/null
    then
        wget -qO- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.3/install.sh | bash
    else
        echo "Neither curl nor wget command is present, unable to proceed."
        exit 1
    fi
else
    MINIMAL="v18.18.2"
    DETECTED=$(node -v)
    echo $DETECTED
    RESULT=$(node -e "console.log(\"$DETECTED\".replace('v', '').localeCompare(\"$MINIMAL\".replace('v', ''), undefined, { numeric: true }))")
    if [ $RESULT -lt 0 ]; then
        echo "Minimal supported version is $MINIMAL"
        exit 1
    fi
fi

HAS_NVM_INSTALLED=$(command -v nvm);
PROFILE_PATH=$(detect_profile)

if [ -n "$HAS_NVM_INSTALLED" ]; then
  echo "Installing @ibm-generative-ai/cli ..."
  npm install --loglevel error -g @ibm-generative-ai/cli@latest
else
  INSTALL_DIR="$HOME/.genai/cli"
  mkdir -p "$INSTALL_DIR"

  echo "Installing @ibm-generative-ai/cli ..."
  npm install --prefix="$INSTALL_DIR" --quiet -g @ibm-generative-ai/cli@latest

  export PATH="$INSTALL_DIR/bin:$PATH"

  if [ -z "$PROFILE_PATH" ]; then
    echo "Bash profile (.bashrc / .bash_profile / .zprofile / .zshrc) was not detected."
  else
    # Removing already existing profile updates
    sed -i -e '/# GenAI CLI/{N;d;}' "$PROFILE_PATH"

    echo "# GenAI CLI (do not modify)" >> "$PROFILE_PATH"
    echo "export PATH=\"$PATH\"" >> "$PROFILE_PATH"
  fi
fi

echo -n "Checking the command version ... "
if command genai --version 2>/dev/null ; then
  echo ""
  echo "GenAI CLI has been successfully installed."
  echo ""

  if [ -n "$HAS_NVM_INSTALLED" ]; then
    echo "To uninstall GenAI run \"npm uninstall -g @ibm-generative-ai/cli"\"
  else
    echo "To uninstall GenAI run following commands:"
    echo "npm uninstall -g --prefix=\"$INSTALL_DIR\" @ibm-generative-ai/cli"
    echo "sed -i -e '/# GenAI CLI/{N;d;}' \"$PROFILE_PATH\""
    echo ""
  fi

  echo "To enable completion run \"genai completion\" for further instructions"
  echo ""

  echo "Done!"
  echo ""
  if [ -z "$PROFILE_PATH" ]; then
    echo "We were not able to modify your bash profile. You will need to run GenAI CLI with \"npx genai\"."
  else
    echo "Start using GenAI CLI with the \"genai\" command."
  fi
else
    echo "";
    echo "Failure, make sure your PATH is set up correctly"
fi
