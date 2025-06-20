const DatabaseManager = require("./DatabaseManager");

class AuthManager {
  constructor() {
    this.activeSessions = new Map();
    this.pendingLogins = new Map();
  }

  init() {
    console.log("Initializing Auth Manager...");
    this.setupEventHandlers();
    console.log("Auth Manager initialized");
  }

  setupEventHandlers() {
    // Handle player join - show login UI automatically
    mp.events.add("playerJoin", this.onPlayerJoin.bind(this));

    // Handle player quit - cleanup session
    mp.events.add("playerQuit", this.onPlayerQuit.bind(this));

    // Handle authentication events from client UI
    mp.events.add("auth:login", this.handleLogin.bind(this));
    mp.events.add("auth:signup", this.handleSignup.bind(this));
    mp.events.add("auth:logout", this.handleLogout.bind(this));
  }

  onPlayerJoin(player) {
    console.log(
      `Player ${player.name} joined - showing login UI automatically`
    );

    this.showLoginUI(player);

    // Freeze player until they log in using correct RAGE:MP API
    player.freezePosition = true;
    player.setVariable("authenticated", false);

    player.outputChatBox(
      "!{FFFF00}Welcome to RAGE:MP! Please login or create an account to continue."
    );
  }

  onPlayerQuit(player) {
    console.log(`Player ${player.name} quit - cleaning up session`);

    const sessionToken = player.getVariable("sessionToken");
    if (sessionToken) {
      this.invalidateSession(sessionToken);
    }

    this.activeSessions.delete(player.id);
  }

  async handleLogin(player, username, password) {
    try {
      console.log(`Login attempt for user: ${username}`);

      if (!username || !password) {
        this.sendAuthResponse(
          player,
          false,
          "Username and password are required"
        );
        return;
      }

      const result = await DatabaseManager.authenticateUser(username, password);

      if (result.success) {
        const sessionToken = this.generateSessionToken();
        const session = await DatabaseManager.createSession(
          result.user.id,
          sessionToken
        );

        if (session) {
          this.activeSessions.set(player.id, {
            userId: result.user.id,
            username: result.user.username,
            sessionToken: sessionToken,
            loginTime: Date.now(),
          });

          player.setVariable("authenticated", true);
          player.setVariable("userId", result.user.id);
          player.setVariable("username", result.user.username);
          player.setVariable("sessionToken", sessionToken);

          // Unfreeze player and spawn them using correct API
          player.freezePosition = false;
          player.spawn(new mp.Vector3(-1037.74, -2738.04, 20.17));

          this.sendAuthResponse(
            player,
            true,
            "Login successful! Welcome back!"
          );

          player.outputChatBox(
            "!{00FF00}Welcome back, " + result.user.username + "!"
          );
          player.outputChatBox("!{FFFFFF}Type /help for available commands");

          console.log(`User ${username} logged in successfully`);
        } else {
          this.sendAuthResponse(player, false, "Failed to create session");
        }
      } else {
        this.sendAuthResponse(player, false, result.error);
      }
    } catch (error) {
      console.error("Login error:", error);
      this.sendAuthResponse(player, false, "An error occurred during login");
    }
  }

  async handleSignup(player, username, email, password, confirmPassword) {
    try {
      console.log(`Signup attempt for user: ${username}`);

      if (!username || !email || !password || !confirmPassword) {
        this.sendAuthResponse(player, false, "All fields are required");
        return;
      }

      if (password !== confirmPassword) {
        this.sendAuthResponse(player, false, "Passwords do not match");
        return;
      }

      if (password.length < 6) {
        this.sendAuthResponse(
          player,
          false,
          "Password must be at least 6 characters"
        );
        return;
      }

      if (username.length < 3) {
        this.sendAuthResponse(
          player,
          false,
          "Username must be at least 3 characters"
        );
        return;
      }

      const result = await DatabaseManager.createUser({
        username: username,
        email: email,
        password: password,
      });

      if (result.success) {
        this.sendAuthResponse(
          player,
          true,
          "Account created successfully! Please log in with your new account."
        );
        console.log(`User ${username} registered successfully`);
      } else {
        this.sendAuthResponse(player, false, result.error);
      }
    } catch (error) {
      console.error("Signup error:", error);
      this.sendAuthResponse(player, false, "An error occurred during signup");
    }
  }

  async handleLogout(player) {
    try {
      const sessionToken = player.getVariable("sessionToken");
      if (sessionToken) {
        await this.invalidateSession(sessionToken);
      }

      player.setVariable("authenticated", false);
      player.setVariable("userId", null);
      player.setVariable("username", null);
      player.setVariable("sessionToken", null);

      this.activeSessions.delete(player.id);

      player.kick("Logged out");

      console.log(`User logged out: ${player.name}`);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  showLoginUI(player) {
    // Send CEF event to show login UI
    player.call("auth:showLoginUI");
  }

  hideLoginUI(player) {
    // Send CEF event to hide login UI
    player.call("auth:hideLoginUI");
  }

  sendAuthResponse(player, success, message) {
    // Send response to client
    player.call("auth:response", [success, message]);

    if (success) {
      this.hideLoginUI(player);
    }
  }

  generateSessionToken() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  async invalidateSession(sessionToken) {
    return await DatabaseManager.invalidateSession(sessionToken);
  }

  // Utility methods
  isPlayerAuthenticated(player) {
    return player.getVariable("authenticated") === true;
  }

  getPlayerSession(playerId) {
    return this.activeSessions.get(playerId);
  }

  getAuthenticatedPlayers() {
    return Array.from(this.activeSessions.keys());
  }

  getActiveSessionCount() {
    return this.activeSessions.size;
  }

  // Validation methods
  validateUsername(username) {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  }

  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  validatePassword(password) {
    return password.length >= 6;
  }
}

module.exports = new AuthManager();
