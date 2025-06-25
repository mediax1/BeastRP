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

const governmentBlip = mp.blips.new(
  419,
  new mp.Vector3(-541.96, -208.34, 37.66),
  {
    name: "Government",
    color: 4,
    shortRange: true,
  }
);
governmentBlip.setCategory(1);

const sahpBlip = mp.blips.new(60, new mp.Vector3(-426.76, 6024.04, 31.49), {
  name: "SAHP",
  color: 5,
  shortRange: true,
});
sahpBlip.setCategory(1);

mp.events.add("getWaypointCoordinates", () => {
  const waypoint = mp.game.ui.getFirstBlipInfoId(8);

  if (!mp.game.ui.doesBlipExist(waypoint)) {
    mp.gui.chat.push("!{red}[ERROR]!{white} No waypoint set on the map!");
    return;
  }

  const waypointCoords = mp.game.ui.getBlipInfoIdCoord(waypoint);

  if (waypointCoords.x === 0 && waypointCoords.y === 0) {
    mp.gui.chat.push("!{red}[ERROR]!{white} Invalid waypoint coordinates!");
    return;
  }

  const groundZ = mp.game.gameplay.getGroundZFor3dCoord(
    waypointCoords.x,
    waypointCoords.y,
    1000.0,
    0,
    false
  );

  if (groundZ === 0) {
    mp.gui.chat.push(
      "!{red}[ERROR]!{white} Could not find ground level at waypoint!"
    );
    return;
  }

  const finalZ = groundZ + 1.0;

  mp.events.callRemote(
    "teleportToWaypoint",
    waypointCoords.x,
    waypointCoords.y,
    finalZ
  );
});
