require("./scripts/auth.js");
require("./scripts/character.js");
require("./scripts/rental.js");
require("./scripts/hud.js");
require("./scripts/garbage.js");
mp.events.add("render", () => {});

const hospitalBlip = mp.blips.new(
  621,
  new mp.Vector3(-238.54, 6320.59, 32.28),
  {
    name: "Paleto Bay Hospital",
    color: 1,
    shortRange: true,
  }
);
hospitalBlip.setCategory(1);
