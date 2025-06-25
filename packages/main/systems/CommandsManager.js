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

    mp.events.addCommand("cleansessions", (player) => {
      this.cleanupSessions(player);
    });

    mp.events.addCommand("sessionstats", (player) => {
      this.showSessionStats(player);
    });

    mp.events.addCommand("tpwaypoint", (player) => {
      this.teleportToWaypoint(player);
    });
  }

  setupEvents() {
    mp.events.add("playerJoin", (player) => {
      console.log(`Player ${player.name} joined the server`);
    });

    mp.events.add("playerQuit", (player) => {
      console.log(`Player ${player.name} left the server`);
    });

    mp.events.add("teleportToWaypoint", (player, x, y, z) => {
      this.performTeleport(player, x, y, z);
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
    player.outputChatBox(`!{cyan}/tpwaypoint!{white} - Teleport to waypoint`);
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
    player.outputChatBox(`!{yellow}[ADMIN COMMANDS]!{white}`);
    player.outputChatBox(
      `!{cyan}/cleansessions!{white} - Clean up expired sessions`
    );
    player.outputChatBox(
      `!{cyan}/sessionstats!{white} - Show session statistics`
    );
  }

  async cleanupSessions(player) {
    try {
      const DatabaseManager = require("../../auth/systems/DatabaseManager.js");

      player.outputChatBox(
        `!{yellow}[SESSION CLEANUP]!{white} Starting cleanup...`
      );

      const cleanedCount = await DatabaseManager.performFullSessionCleanup();

      player.outputChatBox(
        `!{green}[SESSION CLEANUP]!{white} Completed! Removed ${cleanedCount} sessions.`
      );
      console.log(
        `Admin ${player.name} triggered session cleanup: ${cleanedCount} sessions removed`
      );
    } catch (error) {
      console.error("Error during admin session cleanup:", error);
      player.outputChatBox(
        `!{red}[SESSION CLEANUP]!{white} Error occurred during cleanup.`
      );
    }
  }

  async showSessionStats(player) {
    try {
      const DatabaseManager = require("../../auth/systems/DatabaseManager.js");

      const stats = await DatabaseManager.getStats();

      if (stats) {
        player.outputChatBox(`!{yellow}[SESSION STATS]!{white}`);
        player.outputChatBox(
          `!{cyan}Active in database:!{white} ${stats.activeSessions}`
        );
        player.outputChatBox(
          `!{cyan}Total sessions:!{white} ${stats.totalSessions}`
        );
        player.outputChatBox(`!{cyan}Total users:!{white} ${stats.totalUsers}`);
        player.outputChatBox(`!{cyan}Database type:!{white} ${stats.dbType}`);
      } else {
        player.outputChatBox(
          `!{red}[SESSION STATS]!{white} Unable to retrieve statistics.`
        );
      }
    } catch (error) {
      console.error("Error getting session stats:", error);
      player.outputChatBox(
        `!{red}[SESSION STATS]!{white} Error occurred while getting statistics.`
      );
    }
  }

  teleportToWaypoint(player) {
    player.call("getWaypointCoordinates");
  }

  performTeleport(player, x, y, z) {
    try {
      const newPosition = new mp.Vector3(
        parseFloat(x),
        parseFloat(y),
        parseFloat(z)
      );
      player.position = newPosition;

      player.outputChatBox(
        `!{green}[TELEPORT]!{white} Teleported to waypoint!`
      );
      player.outputChatBox(
        `!{cyan}Coordinates:!{white} X: ${x.toFixed(2)}, Y: ${y.toFixed(
          2
        )}, Z: ${z.toFixed(2)}`
      );

      console.log(
        `Player ${player.name} teleported to waypoint: ${x}, ${y}, ${z}`
      );
    } catch (error) {
      console.error(`[TELEPORT ERROR] ${error}`);
      player.outputChatBox(
        `!{red}[ERROR]!{white} Failed to teleport to waypoint!`
      );
    }
  }
}

const commandsManager = new CommandsManager();

module.exports = commandsManager;
