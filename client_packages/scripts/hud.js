class HUDManager {
  constructor() {
    this.browser = null;
    this.visible = false;
    this.serverName = "Beast RP";
    this.playerId = null;
    this.wallet = 0;
    this.bank = 0;
  }

  init() {
    this.createBrowser();
    this.setupEventHandlers();
  }

  createBrowser() {
    this.browser = mp.browsers.new("package://ui/hud.html");
    this.browser.active = false;
  }

  setupEventHandlers() {
    mp.events.add("hud:show", this.show.bind(this));
    mp.events.add("hud:hide", this.hide.bind(this));
    mp.events.add("hud:setServerName", this.setServerName.bind(this));
    mp.events.add("hud:setPlayerId", this.setPlayerId.bind(this));
    mp.events.add("hud:setMoney", this.setMoney.bind(this));

    mp.events.add("hud:updateMoney", this.updateMoney.bind(this));
  }

  show() {
    if (this.visible) return;

    this.visible = true;
    this.browser.active = true;
    this.browser.execute(`window.postMessage({type: 'showHUD'}, '*');`);
  }

  hide() {
    if (!this.visible) return;

    this.visible = false;
    this.browser.active = false;
    this.browser.execute(`window.postMessage({type: 'hideHUD'}, '*');`);
  }

  setServerName(name) {
    this.serverName = name;
    this.browser.execute(
      `window.postMessage({type: 'setServerName', serverName: '${name}'}, '*');`
    );
  }

  setPlayerId(id) {
    this.playerId = id;
    this.browser.execute(
      `window.postMessage({type: 'setPlayerId', playerId: '${id}'}, '*');`
    );
  }

  setMoney(wallet, bank) {
    this.wallet = wallet;
    this.bank = bank;
    this.browser.execute(
      `window.postMessage({type: 'setMoney', wallet: '${wallet}', bank: '${bank}'}, '*');`
    );
  }

  updateMoney(wallet, bank) {
    this.wallet = wallet;
    this.bank = bank;
    this.browser.execute(
      `window.postMessage({type: 'setMoney', wallet: '${wallet}', bank: '${bank}'}, '*');`
    );

    mp.players.local.setVariable("money", wallet);
    mp.players.local.setVariable("bank", bank);
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

global.hudManager = new HUDManager();
global.hudManager.init();
