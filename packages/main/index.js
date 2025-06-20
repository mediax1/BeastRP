console.log("=== Starting RAGE:MP Server ===");

console.log("Loading authentication system...");
global.AuthManager = require("../auth/index.js");

console.log("=== Server Started Successfully ===");
console.log("Authentication system loaded and ready");
console.log("Players will see login/signup UI automatically when they join");

mp.events.add("playerJoin", (player) => {
  console.log(`Player ${player.name} joined the server`);
});

mp.events.add("playerQuit", (player) => {
  console.log(`Player ${player.name} left the server`);
});

mp.events.addCommand("help", (player) => {
  player.outputChatBox("!{FFFF00}=== Available Commands ===");
  player.outputChatBox("!{FFFFFF}/logout - Logout from your account");
  player.outputChatBox("!{FFFFFF}/stats - View your statistics");
  player.outputChatBox("!{FFFFFF}/help - Show this help message");
  player.outputChatBox("!{FFFFFF}/serverinfo - Server information");
  player.outputChatBox(
    "!{FFFF00}Note: Login and signup are done through the UI when you join!"
  );
});

mp.events.addCommand("stats", (player) => {
  if (!global.AuthManager.AuthManager.isPlayerAuthenticated(player)) {
    player.outputChatBox("!{FF0000}You must be logged in to view stats!");
    return;
  }

  const session = global.AuthManager.AuthManager.getPlayerSession(player.id);
  if (session) {
    player.outputChatBox("!{FFFF00}=== Your Statistics ===");
    player.outputChatBox(`!{FFFFFF}Username: ${session.username}`);
    player.outputChatBox(`!{FFFFFF}User ID: ${session.userId}`);
    player.outputChatBox(
      `!{FFFFFF}Login Time: ${new Date(session.loginTime).toLocaleString()}`
    );
    player.outputChatBox(
      `!{FFFFFF}Session Duration: ${Math.floor(
        (Date.now() - session.loginTime) / 1000
      )} seconds`
    );
  }
});

mp.events.addCommand("serverinfo", (player) => {
  player.outputChatBox("!{FFFF00}=== Server Information ===");
  player.outputChatBox(`!{FFFFFF}Server: RAGE:MP Authentication Server`);
  player.outputChatBox(`!{FFFFFF}Players Online: ${mp.players.length}`);
  player.outputChatBox(
    `!{FFFFFF}Authenticated Players: ${global.AuthManager.AuthManager.getActiveSessionCount()}`
  );
  player.outputChatBox(`!{FFFFFF}Database Type: JSON (File-based)`);
});

console.log("Server commands registered");
console.log("Authentication is UI-based - no login/signup commands needed");
