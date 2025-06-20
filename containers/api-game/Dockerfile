#Step 1: build
FROM node:22.14 AS builder

COPY /src /src
WORKDIR /src

RUN npm install --workspace=backend/api-game && npm run build --workspace=backend/api-game

FROM node:22.14
RUN apt update && apt install vim -y #for development purposes
WORKDIR /build
COPY --from=builder /src/build/api-game.js .
COPY --from=builder /src/backend/api-game/package.json .
COPY --from=builder /src/node_modules ./node_modules

#install sqlite3
RUN apt update && apt install -y sqlite3

ENTRYPOINT ["node", "game-api.js"]
# CMD sleep infinity
