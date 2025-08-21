ARG VARIANT="20.18.3-bookworm"
FROM node:${VARIANT}

# Install dependencies and set up K6
RUN apt-get update && \
    DEBIAN_FRONTEND=noninteractive apt-get install -y \
        libasound2 \
        libgbm-dev \
        libgtk-3-0 \
        libgtk2.0-0 \
        libnotify-dev \
        libnss3 \
        libxss1 \
        libxtst6 \
        vim \
        xauth \
        xvfb \
    && apt-get clean

# Layer 5: Install global npm packages (changes with project dependencies)
RUN npm install -g knex jest dotenv-cli

# Layer 6: Ensure devcontainer scripts are executable (will be set during container startup)
