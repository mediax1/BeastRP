const AuthManager = require("./systems/AuthManager.js");
const DatabaseManager = require("./systems/DatabaseManager.js");
const AuthCommands = require("./systems/AuthCommands.js");

async function initializeAuth() {
  try {
    await DatabaseManager.init();
    await AuthManager.init();
    AuthCommands.init();
    console.log("Auth package initialized successfully");
  } catch (error) {
    console.error("Failed to initialize auth package:", error);
    process.exit(1);
  }
}

initializeAuth();

module.exports = {
  AuthManager,
  DatabaseManager,
  AuthCommands,
};
