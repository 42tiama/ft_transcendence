#Step 1: build
FROM node:22.14 AS deps

COPY /src /src
WORKDIR /src

RUN npm install 

#step2: building
FROM node:22.14 AS builder-game-service
COPY --from=deps /src /src
WORKDIR /src
RUN npm run build --workspace=backend/game-service

#step 3
FROM node:22.14
RUN apt update && apt install vim -y #for development purposes
WORKDIR /build
COPY --from=builder-game-service /src/build/game-service.js .
COPY --from=deps /src/backend/game-service/package.json .
COPY --from=deps /src/node_modules ./node_modules

#install sqlite3
RUN apt update && apt install -y sqlite3

ENTRYPOINT ["node", "game-service.js"]
# CMD sleep infinity
# CMD ["tail", "-f", "/dev/null"]
