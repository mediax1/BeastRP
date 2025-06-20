class AuthUI {
  constructor() {
    this.visible = false;
    this.currentMode = "login";
    this.browser = null;
  }

  init() {
    this.createBrowser();
    this.setupEventHandlers();
  }

  createBrowser() {
    this.browser = mp.browsers.new("package://login.html");
    this.browser.active = false;
  }

  setupEventHandlers() {
    this.browser.execute(`window.addEventListener('message', function(event) {
            mp.trigger('auth:uiEvent', event.data.type, event.data.data);
        });`);

    this.browser.execute(`window.switchMode = ${this.switchMode.toString()};`);

    mp.events.add("auth:uiEvent", this.handleUIEvent.bind(this));
    mp.events.add("auth:showLoginUI", this.show.bind(this));
    mp.events.add("auth:hideLoginUI", this.hide.bind(this));
    mp.events.add("auth:response", this.handleServerResponse.bind(this));
  }

  show() {
    if (this.visible) return;

    console.log("AuthUI: Showing login interface");
    this.visible = true;
    this.browser.active = true;

    setTimeout(() => {
      console.log("AuthUI: Setting cursor visible");
      mp.gui.cursor.visible = true;
      console.log("AuthUI: Cursor visible state:", mp.gui.cursor.visible);
    }, 100);

    mp.game.ui.displayRadar(false);
    mp.game.ui.displayHud(false);

    mp.players.local.freezePosition(true);
  }

  hide() {
    if (!this.visible) return;

    this.visible = false;
    this.browser.active = false;

    mp.gui.cursor.visible = false;
    mp.game.ui.displayRadar(true);
    mp.game.ui.displayHud(true);

    mp.players.local.freezePosition(false);
  }

  switchMode(mode) {
    this.currentMode = mode;
    this.browser.execute(`switchMode('${mode}');`);
    console.log("AuthUI: switchMode executed in browser with mode:", mode);
  }

  handleUIEvent(type, data, ...additionalData) {
    switch (type) {
      case "login":
        this.handleLogin(data, additionalData[0]);
        break;
      case "signup":
        this.handleSignup(
          data,
          additionalData[0],
          additionalData[1],
          additionalData[2]
        );
        break;
      case "switchMode":
        this.currentMode = data.mode;
        console.log("AuthUI: currentMode updated to", data.mode);
        break;
      case "close":
        this.hide();
        break;
    }
  }

  handleLogin(username, password) {
    if (!username || !password) {
      this.showError("Please fill in all fields");
      return;
    }
    mp.events.callRemote("auth:login", username, password);
  }

  handleSignup(username, email, password, confirmPassword) {
    if (!username || !email || !password || !confirmPassword) {
      this.showError(
        `auth.js Please fill in all fields ${username} ${email} ${password} ${confirmPassword}`
      );
      return;
    }
    if (password !== confirmPassword) {
      this.showError("Passwords do not match");
      return;
    }
    if (password.length < 6) {
      this.showError("Password must be at least 6 characters");
      return;
    }
    if (username.length < 3) {
      this.showError("Username must be at least 3 characters");
      return;
    }
    if (!this.isValidEmail(email)) {
      this.showError("Please enter a valid email address");
      return;
    }
    mp.events.callRemote(
      "auth:signup",
      username,
      email,
      password,
      confirmPassword
    );
  }

  isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  handleServerResponse(success, message) {
    if (success) {
      this.showSuccess(message);

      if (message.includes("Account created successfully")) {
        setTimeout(() => {
          this.switchMode("login");
          this.showInfo("Please login with your new account");
        }, 2000);
      } else {
        setTimeout(() => {
          this.hide();
        }, 2000);
      }
    } else {
      this.showError(message);
    }
  }

  showError(message) {
    const safeMessage = message.replace(/'/g, "\\'");
    this.browser.execute(`showMessage('error', '${safeMessage}');`);
  }

  showSuccess(message) {
    const safeMessage = message.replace(/'/g, "\\'");
    this.browser.execute(`showMessage('success', '${safeMessage}');`);
  }

  showInfo(message) {
    const safeMessage = message.replace(/'/g, "\\'");
    this.browser.execute(`showMessage('info', '${safeMessage}');`);
  }

  isVisible() {
    return this.visible;
  }

  getCurrentMode() {
    return this.currentMode;
  }

  destroy() {
    if (this.browser) {
      this.browser.destroy();
      this.browser = null;
    }
  }
}

class AuthEvents {
  constructor() {
    this.isAuthenticated = false;
    this.userData = null;
  }

  init() {
    this.setupEventHandlers();
  }

  setupEventHandlers() {
    mp.events.add("auth:authenticated", this.onAuthenticated.bind(this));
    mp.events.add("auth:logout", this.onLogout.bind(this));
    mp.events.add("playerSpawn", this.onPlayerSpawn.bind(this));
    mp.keys.bind(0x1b, false, this.onEscapeKey.bind(this));
    mp.events.add("playerCommand", this.onPlayerCommand.bind(this));
  }

  onAuthenticated(userData) {
    this.isAuthenticated = true;
    this.userData = userData;
    this.enableGameFeatures();
    mp.events.call("auth:playerAuthenticated", userData);
  }

  onLogout() {
    this.isAuthenticated = false;
    this.userData = null;
    this.disableGameFeatures();
    mp.events.callRemote("auth:logout");
  }

  onPlayerSpawn() {
    if (!this.isAuthenticated) {
      setTimeout(() => {
        mp.events.call("auth:showLoginUI");
      }, 500);
    }
  }

  onEscapeKey() {
    if (authUI.isVisible()) {
      authUI.hide();
    }
  }

  onPlayerCommand(command) {
    if (command === "logout" && this.isAuthenticated) {
      this.onLogout();
    }
  }

  enableGameFeatures() {
    mp.gui.chat.show(true);
    mp.gui.chat.activate(true);
  }

  disableGameFeatures() {
    mp.gui.chat.show(false);
    mp.gui.chat.activate(false);
  }

  isPlayerAuthenticated() {
    return this.isAuthenticated;
  }

  getUserData() {
    return this.userData;
  }

  getUsername() {
    return this.userData ? this.userData.username : null;
  }

  getUserId() {
    return this.userData ? this.userData.id : null;
  }
}

const authUI = new AuthUI();
const authEvents = new AuthEvents();

authUI.init();
authEvents.init();
