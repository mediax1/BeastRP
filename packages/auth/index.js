const AuthManager = require("./systems/AuthManager.js");
const DatabaseManager = require("./systems/DatabaseManager.js");
const AuthCommands = require("./systems/AuthCommands.js");

DatabaseManager.init();
AuthManager.init();
AuthCommands.init();

module.exports = {
  AuthManager,
  DatabaseManager,
  AuthCommands,
};
