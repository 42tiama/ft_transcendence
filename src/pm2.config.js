// pm2.config.js
module.exports = {
  apps: [
    {
      name: "client",
      script: "client.js",
      cwd: "./build"
    },
    {
      name: "auth",
      script: "auth.js",
      cwd: "./build"
    },
    {
      name: "api-gateway",
      script: "api-gateway.js",
      cwd: "./build"
    },
    {
      name: "game-service",
      script: "backend/game-service/game-service.js",
      cwd: "./build"
    }
  ]
};
