const DatabaseManager = require("./DatabaseManager.js");
const CharacterManager = require("./CharacterManager.js");

class AuthManager {
  constructor() {
    this.activeSessions = new Map();
    this.pendingLogins = new Map();
  }

  async init() {
    await DatabaseManager.init();
    await CharacterManager.init();

    this.setupEventHandlers();

    await this.performStartupCleanup();

    this.setupPeriodicCleanup();

    console.log("AuthManager initialized");
  }

  setupEventHandlers() {
    mp.events.add("playerJoin", this.onPlayerJoin.bind(this));
    mp.events.add("playerQuit", this.onPlayerQuit.bind(this));
    mp.events.add("auth:login", this.handleLogin.bind(this));
    mp.events.add("auth:signup", this.handleSignup.bind(this));
    mp.events.add("auth:logout", this.handleLogout.bind(this));
    mp.events.add("character:create", this.handleCharacterCreation.bind(this));
  }

  onPlayerJoin(player) {
    console.log(`Player ${player.name} joined, showing login UI`);
    player.freezePosition = true;
    const spawnPosition = new mp.Vector3(-595.71, 36.77, 43.61);
    const heading = 180.0;

    player.spawn(spawnPosition, heading);
    setTimeout(() => {
      this.showLoginUI(player);
    }, 1000);
  }

  onPlayerQuit(player) {
    if (!player || !player.name) {
      console.log("Player quit event received for invalid player object");
      return;
    }

    console.log(`Player ${player.name} left the server`);

    try {
      const sessionToken = player.getVariable("sessionToken");
      if (sessionToken) {
        this.invalidateSession(sessionToken).catch((error) => {
          console.error(
            `Error invalidating session for player ${player.name}:`,
            error
          );
        });
      }
    } catch (error) {
      console.error(`Error handling player quit for ${player.name}:`, error);
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
          result.user.userId,
          sessionToken
        );

        if (session) {
          this.activeSessions.set(player.id, {
            userId: result.user.userId,
            username: result.user.username,
            sessionToken: sessionToken,
            loginTime: Date.now(),
          });

          player.setVariable("authenticated", true);
          player.setVariable("userId", result.user.userId);
          player.setVariable("username", result.user.username);
          player.setVariable("sessionToken", sessionToken);

          const character = await CharacterManager.getCharacterByUserId(
            result.user.userId
          );

          if (!character) {
            console.log(
              `No character found for user ${result.user.username}, showing character creation UI`
            );
            this.sendAuthResponse(
              player,
              true,
              "Login successful! Please create your character."
            );
            setTimeout(() => {
              console.log(
                `Triggering character creation UI for user ${result.user.username}`
              );
              this.showCharacterCreationUI(player);
            }, 2000);
          } else {
            console.log(
              `Character found for user ${result.user.username}, spawning with character`
            );
            this.spawnPlayerWithCharacter(player, character);
            this.sendAuthResponse(
              player,
              true,
              `Welcome back, ${character.firstName} ${character.lastName}!`
            );
          }

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

  async handleCharacterCreation(player, firstName, lastName, gender) {
    try {
      console.log(
        `Character creation attempt for user: ${player.getVariable("username")}`
      );

      if (!firstName || !lastName || !gender) {
        this.sendCharacterResponse(player, false, "All fields are required");
        return;
      }

      if (firstName.length < 2 || lastName.length < 2) {
        this.sendCharacterResponse(
          player,
          false,
          "Names must be at least 2 characters"
        );
        return;
      }

      if (firstName.length > 20 || lastName.length > 20) {
        this.sendCharacterResponse(
          player,
          false,
          "Names must be less than 20 characters"
        );
        return;
      }

      if (gender !== "male" && gender !== "female") {
        this.sendCharacterResponse(
          player,
          false,
          "Gender must be either 'male' or 'female'"
        );
        return;
      }

      const userId = player.getVariable("userId");
      const result = await CharacterManager.createCharacter(
        userId,
        firstName,
        lastName,
        gender
      );

      if (result.success) {
        this.sendCharacterResponse(
          player,
          true,
          `Character created successfully! Welcome to the server, ${firstName} ${lastName}!`
        );

        setTimeout(() => {
          this.spawnPlayerWithCharacter(player, result.character);
        }, 2000);

        console.log(`Character created: ${firstName} ${lastName} (${gender})`);
      } else {
        this.sendCharacterResponse(player, false, result.error);
      }
    } catch (error) {
      console.error("Character creation error:", error);
      this.sendCharacterResponse(
        player,
        false,
        "An error occurred during character creation"
      );
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
      player.setVariable("characterId", null);
      player.setVariable("characterName", null);
      player.setVariable("money", null);
      player.setVariable("bank", null);

      this.activeSessions.delete(player.id);

      player.kick("Logged out");

      console.log(`User logged out: ${player.name}`);
    } catch (error) {
      console.error("Logout error:", error);
    }
  }

  showLoginUI(player) {
    player.call("auth:showLoginUI");
  }

  hideLoginUI(player) {
    player.call("auth:hideLoginUI");
  }

  showCharacterCreationUI(player) {
    player.call("character:showCreationUI");
  }

  hideCharacterCreationUI(player) {
    player.call("character:hideCreationUI");
  }

  sendAuthResponse(player, success, message) {
    player.call("auth:response", [success, message]);

    if (
      success &&
      message.includes("Login successful") &&
      !message.includes("Please create your character")
    ) {
      this.hideLoginUI(player);
    }
  }

  sendCharacterResponse(player, success, message) {
    player.call("character:response", [success, message]);

    if (success) {
      this.hideCharacterCreationUI(player);
    }
  }

  spawnPlayerWithCharacter(player, character) {
    player.freezePosition = false;

    const modelHash =
      character.gender === "female"
        ? mp.joaat("mp_f_freemode_01")
        : mp.joaat("mp_m_freemode_01");

    player.model = modelHash;
    player.spawn(
      new mp.Vector3(
        character.position.x,
        character.position.y,
        character.position.z
      )
    );

    setTimeout(() => {
      this.applyCharacterAppearance(player, character.appearance);
    }, 2000);

    player.setVariable("characterId", character.characterId);
    player.setVariable(
      "characterName",
      `${character.firstName} ${character.lastName}`
    );
    player.setVariable("money", character.money || 0);
    player.setVariable("bank", character.bank || 0);
  }

  applyCharacterAppearance(player, appearance) {
    if (
      player.model !==
      (appearance.gender === "female"
        ? mp.joaat("mp_f_freemode_01")
        : mp.joaat("mp_m_freemode_01"))
    ) {
      player.model =
        appearance.gender === "female"
          ? mp.joaat("mp_f_freemode_01")
          : mp.joaat("mp_m_freemode_01");
    }

    setTimeout(() => {
      try {
        if (appearance.headBlend) {
          player.call("character:setHeadBlendData", [
            appearance.headBlend.shapeFirstID || 0,
            appearance.headBlend.shapeSecondID || 0,
            appearance.headBlend.shapeThirdID || 0,
            appearance.headBlend.skinFirstID || 0,
            appearance.headBlend.skinSecondID || 0,
            appearance.headBlend.skinThirdID || 0,
            appearance.headBlend.shapeMix || 0.5,
            appearance.headBlend.skinMix || 0.5,
            appearance.headBlend.thirdMix || 0.0,
            appearance.headBlend.isParent || false,
          ]);
        } else {
          const defaultShape = appearance.gender === "female" ? 21 : 0;
          const defaultSkin = appearance.gender === "female" ? 21 : 0;
          player.call("character:setHeadBlendData", [
            defaultShape,
            defaultShape,
            0,
            defaultSkin,
            defaultSkin,
            0,
            0.5,
            0.5,
            0.0,
            false,
          ]);
        }
      } catch (error) {
        console.error("Error applying head blend data:", error);
      }
    }, 300);

    setTimeout(() => {
      try {
        player.setClothes(1, appearance.masks || 0, 0, 0);
        player.setClothes(2, appearance.hair || 0, 0, 0);
        player.setClothes(3, appearance.torso || 0, 0, 0);
        player.setClothes(4, appearance.legs || 0, 0, 0);
        player.setClothes(5, appearance.bags || 0, 0, 0);
        player.setClothes(6, appearance.feet || 0, 0, 0);
        player.setClothes(7, appearance.accessories || 0, 0, 0);
        player.setClothes(8, appearance.undershirt || 0, 0, 0);
        player.setClothes(9, appearance.bodyArmor || 0, 0, 0);
        player.setClothes(10, appearance.decals || 0, 0, 0);
        player.setClothes(11, appearance.tops || 0, 0, 0);
      } catch (error) {
        console.error("Error applying clothing:", error);
      }
    }, 800);
  }

  generateSessionToken() {
    return (
      "session_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9)
    );
  }

  async invalidateSession(sessionToken) {
    try {
      return await DatabaseManager.invalidateSession(sessionToken);
    } catch (error) {
      console.error("Error invalidating session:", error);
      return false;
    }
  }

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

  async performStartupCleanup() {
    try {
      console.log("Performing startup session cleanup...");
      const cleanedCount = await DatabaseManager.performFullSessionCleanup();
      console.log(
        `Startup cleanup completed: ${cleanedCount} sessions removed`
      );
    } catch (error) {
      console.error("Error during startup cleanup:", error);
    }
  }

  setupPeriodicCleanup() {
    // Clean up sessions every 30 minutes
    setInterval(async () => {
      try {
        const DatabaseManager = require("./DatabaseManager.js");
        const cleanedCount = await DatabaseManager.cleanupExpiredSessions();
        if (cleanedCount > 0) {
          console.log(
            `Periodic cleanup: ${cleanedCount} expired sessions removed`
          );
        }
      } catch (error) {
        console.error("Error during periodic cleanup:", error);
      }
    }, 30 * 60 * 1000); // 30 minutes

    console.log("Periodic session cleanup scheduled (every 30 minutes)");
  }
}

module.exports = new AuthManager();
