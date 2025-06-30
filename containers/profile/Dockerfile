#Step 1: dependencies
FROM node:22.14 AS deps

COPY /src /src
WORKDIR /src

RUN npm install 

#step2: building
FROM node:22.14 AS builder-profile
COPY --from=deps /src /src
WORKDIR /src
RUN npm run build --workspace=backend/profile

FROM node:22.14
RUN apt update && apt install vim -y #for development purposes
WORKDIR /build
COPY --from=builder-profile /src/build/profile.js .
COPY --from=deps /src/backend/profile/package.json .
COPY --from=deps /src/node_modules ./node_modules

#install sqlite3
RUN apt update && apt install -y sqlite3

ENTRYPOINT ["node", "profile.js"]
# CMD sleep infinity
