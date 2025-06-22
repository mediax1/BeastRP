class CommandsManager {
  constructor() {}

  init() {
    this.setupCommands();
    this.setupEvents();
  }

  setupCommands() {
    mp.events.addCommand("help", (player) => {
      this.showHelp(player);
    });
  }

  setupEvents() {
    mp.events.add("playerJoin", (player) => {
      console.log(`Player ${player.name} joined the server`);
    });

    mp.events.add("playerQuit", (player) => {
      console.log(`Player ${player.name} left the server`);
    });
  }

  showHelp(player) {
    player.outputChatBox(`!{yellow}[AVAILABLE COMMANDS]!{white}`);
    player.outputChatBox(
      `!{cyan}/coords!{white} - Get your current coordinates`
    );
    player.outputChatBox(`!{cyan}/veh <name>!{white} - Spawn a vehicle`);
    player.outputChatBox(`!{cyan}/vehicles!{white} - List available vehicles`);
    player.outputChatBox(`!{cyan}/delcar!{white} - Delete current vehicle`);
    player.outputChatBox(
      `!{cyan}/checkped!{white} - Debug PED location and status`
    );
    player.outputChatBox(`!{yellow}[RENTAL SYSTEM]!{white}`);
    player.outputChatBox(
      `!{cyan}Go to rental PED and type /e!{white} - Get temporary vehicle`
    );
    player.outputChatBox(
      `!{cyan}Exit vehicle!{white} - Starts 200s countdown timer`
    );
    player.outputChatBox(
      `!{cyan}Re-enter vehicle!{white} - Stops timer and resumes rental`
    );
  }
}

// Create singleton instance
const commandsManager = new CommandsManager();

module.exports = commandsManager;
