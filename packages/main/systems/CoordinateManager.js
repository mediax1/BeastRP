class CoordinateManager {
  constructor() {}

  init() {
    this.setupCommands();
  }

  setupCommands() {
    mp.events.addCommand("coords", (player) => {
      this.getCoordinates(player);
    });
  }

  getCoordinates(player) {
    const pos = player.position;
    const coords = `X: ${pos.x.toFixed(2)}, Y: ${pos.y.toFixed(
      2
    )}, Z: ${pos.z.toFixed(2)}`;
    player.outputChatBox(
      `!{yellow}[COORDS]!{white} Your current position: ${coords}`
    );
    return pos;
  }
}

const coordinateManager = new CoordinateManager();

module.exports = coordinateManager;
