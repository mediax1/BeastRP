class CharacterCreationUI {
  constructor() {
    this.visible = false;
    this.browser = null;
  }

  init() {
    this.createBrowser();
    this.setupEventHandlers();
  }

  createBrowser() {
    this.browser = mp.browsers.new("package://ui/character.html");
    this.browser.active = false;
  }

  setupEventHandlers() {
    this.browser.execute(`window.addEventListener('message', function(event) {
            mp.trigger('character:uiEvent', event.data.type, event.data.data);
        });`);

    mp.events.add("character:uiEvent", this.handleUIEvent.bind(this));
    mp.events.add("character:showCreationUI", this.show.bind(this));
    mp.events.add("character:hideCreationUI", this.hide.bind(this));
    mp.events.add("character:response", this.handleServerResponse.bind(this));

    console.log("CharacterCreationUI: Event handlers set up");
  }

  show() {
    if (this.visible) return;

    console.log("CharacterCreationUI: Showing character creation interface");
    this.visible = true;
    this.browser.active = true;

    setTimeout(() => {
      console.log("CharacterCreationUI: Setting cursor visible");
      mp.gui.cursor.visible = true;
    }, 100);

    mp.game.ui.displayRadar(false);
    mp.game.ui.displayHud(false);

    mp.players.local.freezePosition(true);
  }

  hide() {
    if (!this.visible) return;

    console.log("CharacterCreationUI: Hiding character creation interface");
    this.visible = false;
    this.browser.active = false;

    mp.gui.cursor.visible = false;
    mp.game.ui.displayRadar(true);
    mp.game.ui.displayHud(true);

    mp.players.local.freezePosition(false);
  }

  handleUIEvent(type, firstName, lastName, gender) {
    console.log(
      "CharacterCreationUI: Received UI event:",
      type,
      firstName,
      lastName,
      gender
    );

    switch (type) {
      case "createCharacter":
        this.handleCharacterCreation(firstName, lastName, gender);
        break;
    }
  }

  handleCharacterCreation(firstName, lastName, gender) {
    console.log(
      "CharacterCreationUI: Creating character with:",
      firstName,
      lastName,
      gender
    );

    if (!firstName || !lastName || !gender) {
      this.showError("Please fill in all fields and select your gender");
      return;
    }

    if (firstName.length < 2 || lastName.length < 2) {
      this.showError("Names must be at least 2 characters long");
      return;
    }

    if (firstName.length > 20 || lastName.length > 20) {
      this.showError("Names must be less than 20 characters");
      return;
    }

    mp.events.callRemote("character:create", firstName, lastName, gender);
  }

  handleServerResponse(success, message) {
    if (success) {
      this.showSuccess(message);
      setTimeout(() => {
        this.hide();
      }, 2000);
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

  isVisible() {
    return this.visible;
  }

  destroy() {
    if (this.browser) {
      this.browser.destroy();
      this.browser = null;
    }
  }
}

const characterCreationUI = new CharacterCreationUI();
characterCreationUI.init();
