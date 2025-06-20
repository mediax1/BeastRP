class AuthCommands {
  constructor() {
    this.commands = new Map();
  }

  init() {
    console.log("Initializing Auth Commands...");
    console.log("Auth Commands initialized");
  }
}

module.exports = new AuthCommands();
