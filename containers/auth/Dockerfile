#Step 1: dependencies
FROM node:22.14-slim AS deps

COPY /src /src
WORKDIR /src

RUN npm install 

#step2: building
FROM node:22.14-slim AS builder-auth
COPY --from=deps /src /src
WORKDIR /src
RUN npm run build --workspace=backend/auth

#step3 runtime container
FROM node:22.14-slim
RUN apt update && apt install vim -y #for development purposes
WORKDIR /build
COPY --from=builder-auth /src/build/auth.js .
COPY --from=deps /src/backend/auth/package.json .
COPY --from=deps /src/node_modules ./node_modules

#install sqlite3
RUN apt update && apt install -y sqlite3

ENTRYPOINT ["node", "auth.js"]
# CMD sleep infinity
