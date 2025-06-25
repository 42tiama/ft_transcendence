#Step 1: build
FROM node:22.14 AS builder

COPY /src /src
WORKDIR /src

RUN npm install --workspace=backend/game-service && npm run build --workspace=backend/game-service

FROM node:22.14
RUN apt update && apt install vim -y #for development purposes
WORKDIR /build
COPY --from=builder /src/build/game-service.js .
COPY --from=builder /src/backend/game-service/package.json .
COPY --from=builder /src/node_modules ./node_modules

#install sqlite3
RUN apt update && apt install -y sqlite3

ENTRYPOINT ["node", "game-service.js"]
# CMD sleep infinity
# CMD ["tail", "-f", "/dev/null"]
