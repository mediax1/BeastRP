class AuthCommands {
  constructor() {
    this.commands = new Map();
  }

  init() {
    console.log("Initializing Auth Commands...");
    this.registerCommands();
    console.log("Auth Commands initialized");
  }

  registerCommands() {
    // Only utility commands - no login/signup commands
    mp.events.addCommand("logout", this.cmdLogout.bind(this));
    mp.events.addCommand("stats", this.cmdStats.bind(this));
    mp.events.addCommand("help", this.cmdHelp.bind(this));
    mp.events.addCommand("serverinfo", this.cmdServerInfo.bind(this));

    console.log("Auth commands registered");
  }

  // Utility commands only
  cmdLogout(player) {
    if (!global.AuthManager.isPlayerAuthenticated(player)) {
      player.outputChatBox("!{FF0000}You are not logged in!");
      return;
    }

    global.AuthManager.handleLogout(player);
  }

  cmdStats(player) {
    if (!global.AuthManager.isPlayerAuthenticated(player)) {
      player.outputChatBox("!{FF0000}You must be logged in to view stats!");
      return;
    }

    const session = global.AuthManager.getPlayerSession(player.id);
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
  }

  cmdHelp(player) {
    player.outputChatBox("!{FFFF00}=== Available Commands ===");
    player.outputChatBox("!{FFFFFF}/logout - Logout from your account");
    player.outputChatBox("!{FFFFFF}/stats - View your statistics");
    player.outputChatBox("!{FFFFFF}/help - Show this help message");
    player.outputChatBox("!{FFFFFF}/serverinfo - Server information");
    player.outputChatBox(
      "!{FFFF00}Note: Login and signup are done through the UI when you join!"
    );
  }

  cmdServerInfo(player) {
    player.outputChatBox("!{FFFF00}=== Server Information ===");
    player.outputChatBox(`!{FFFFFF}Server: RAGE:MP Authentication Server`);
    player.outputChatBox(`!{FFFFFF}Players Online: ${mp.players.length}`);
    player.outputChatBox(
      `!{FFFFFF}Authenticated Players: ${global.AuthManager.getActiveSessionCount()}`
    );
    player.outputChatBox(`!{FFFFFF}Database Type: JSON (File-based)`);
  }
}

module.exports = new AuthCommands();
