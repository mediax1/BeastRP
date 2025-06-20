global.AuthManager = require("../auth/index.js");

mp.events.add("playerJoin", (player) => {
  console.log(`Player ${player.name} joined the server`);
});

mp.events.add("playerQuit", (player) => {
  console.log(`Player ${player.name} left the server`);
});

console.log("Authentication is UI-based - no login/signup commands needed");
