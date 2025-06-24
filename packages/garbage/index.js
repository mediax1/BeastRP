const GARBAGE_DEPOT = {
  x: -321.7,
  y: -1545.9,
  z: 31.0,
  heading: 270.0,
};

const GARBAGE_TRUCK_SPAWN = {
  x: -326.7,
  y: -1529.9,
  z: 27.5,
  heading: 270.0,
};

const GARBAGE_NPC_MODEL = "s_m_y_dockwork_01";

const GARBAGE_BAG_MODEL = "prop_rub_binbag_01";
const GARBAGE_BAG_COUNT = 150;
const GARBAGE_BAG_EXCLUSION_RADIUS = 25.0;
const GARBAGE_BAG_REWARD = 100;

function initialize() {
  global.garbageNPC = mp.peds.new(
    mp.joaat(GARBAGE_NPC_MODEL),
    new mp.Vector3(GARBAGE_DEPOT.x, GARBAGE_DEPOT.y, GARBAGE_DEPOT.z),
    {
      heading: 0,
      dynamic: false,
      frozen: true,
      invincible: true,
    }
  );

  mp.events.add("garbageJob:start", startGarbageJob);
  mp.events.add("garbageJob:end", endGarbageJob);
  mp.events.add("garbageJob:pickupBag", pickupGarbageBag);
  mp.events.add("garbageJob:depositBag", depositGarbageBag);
  mp.events.add("garbageJob:adjustBagZ", adjustBagZ);

  mp.events.addCommand("garbageinfo", (player) => {
    let playersOnJob = 0;
    let totalBagsSpawned = 0;
    let totalBagsCollected = 0;

    mp.players.forEach((p) => {
      if (p.getVariable("currentJob") === "garbage") {
        playersOnJob++;

        const playerBags = p.garbageBags ? p.garbageBags.length : 0;
        totalBagsSpawned += playerBags;

        const bagsCollected = p.getVariable("bagsCollected") || 0;
        totalBagsCollected += bagsCollected;

        player.outputChatBox(
          `Player ${p.name}: ${playerBags} bags remaining, ${bagsCollected} bags collected`
        );
      }
    });

    player.outputChatBox(`=== Garbage Job Stats ===`);
    player.outputChatBox(`Players on job: ${playersOnJob}`);
    player.outputChatBox(`Total bags spawned: ${totalBagsSpawned}`);
    player.outputChatBox(`Total bags collected: ${totalBagsCollected}`);
    player.outputChatBox(`Configured bag count: ${GARBAGE_BAG_COUNT}`);
  });

  global.jobBlip = mp.blips.new(
    318,
    new mp.Vector3(GARBAGE_DEPOT.x, GARBAGE_DEPOT.y, GARBAGE_DEPOT.z),
    {
      name: "Garbage Depot",
      color: 2,
      shortRange: true,
    }
  );
}

function startGarbageJob(player) {
  if (!player) {
    return;
  }

  if (player.getVariable("onJob") === true) {
    player.outputChatBox("You are already on a job. Finish or quit it first.");
    return;
  }

  player.setVariable("onJob", true);
  player.setVariable("currentJob", "garbage");
  player.setVariable("jobStartTime", Date.now());
  player.setVariable("bagsCollected", 0);
  player.setVariable("carryingBag", false);

  savePlayerOutfit(player);

  applyGarbageWorkerOutfit(player);

  const garbageTruck = mp.vehicles.new(
    mp.joaat("trash"),
    new mp.Vector3(
      GARBAGE_TRUCK_SPAWN.x,
      GARBAGE_TRUCK_SPAWN.y,
      GARBAGE_TRUCK_SPAWN.z
    ),
    {
      heading: GARBAGE_TRUCK_SPAWN.heading,
      numberPlate: "GARBAGE",
      color: [
        [255, 255, 255],
        [255, 255, 255],
      ],
    }
  );

  garbageTruck.setVariable("owner", player.id);
  player.garbageTruck = garbageTruck;

  spawnGarbageBags(player);

  const startTime = new Date().toLocaleTimeString();

  player.outputChatBox(
    "Garbage job started. Get in the truck and collect garbage bags."
  );

  player.call("garbageJob:started");

  player.call("garbageJob:truckAssigned", [garbageTruck.id]);
}

function endGarbageJob(player, completed = false) {
  if (!player) {
    return;
  }

  if (player.getVariable("currentJob") !== "garbage") {
    return;
  }

  restorePlayerOutfit(player);

  const bagsCollected = player.getVariable("bagsCollected") || 0;
  const totalPayment = bagsCollected * GARBAGE_BAG_REWARD;

  if (player.getVariable("carryingBag") === true) {
    player.setVariable("carryingBag", false);
  }

  player.setVariable("onJob", false);
  player.setVariable("currentJob", null);
  player.setVariable("carryingBag", false);

  const jobEndTime = Date.now();
  const jobStartTime = player.getVariable("jobStartTime") || jobEndTime;
  const jobDuration = jobEndTime - jobStartTime;

  const minutes = Math.floor(jobDuration / 60000);
  const seconds = ((jobDuration % 60000) / 1000).toFixed(0);
  const formattedDuration = `${minutes}m ${seconds}s`;

  if (completed && totalPayment > 0) {
    const currentMoney = player.getVariable("money") || 0;
    player.setVariable("money", currentMoney + totalPayment);
  }

  if (player.garbageTruck) {
    if (mp.vehicles.exists(player.garbageTruck)) {
      player.garbageTruck.destroy();
    }
    player.garbageTruck = null;
  }

  cleanupGarbageBags(player);

  const endTime = new Date().toLocaleTimeString();
  const startTime = new Date(jobStartTime).toLocaleTimeString();

  if (completed) {
    player.outputChatBox(`Job complete - you earned $${totalPayment}!`);
    player.outputChatBox(
      `You collected ${bagsCollected} bags in ${formattedDuration}.`
    );
  } else {
    player.outputChatBox(
      `Garbage job ended. You collected ${bagsCollected} bags.`
    );
  }

  player.call("garbageJob:ended", [completed, bagsCollected, totalPayment]);
}

function spawnGarbageBags(player) {
  player.garbageBags = [];
  player.garbageBlips = [];

  const roadAreas = [
    { minX: -1000, maxX: 1000, minY: -100, maxY: 100 },
    { minX: -100, maxX: 100, minY: -1000, maxY: 1000 },
    { minX: -800, maxX: -400, minY: -800, maxY: -400 },
    { minX: 400, maxX: 800, minY: -800, maxY: -400 },
    { minX: -800, maxX: -400, minY: 400, maxY: 800 },
    { minX: 400, maxX: 800, minY: 400, maxY: 800 },
    { minX: -600, maxX: -300, minY: -200, maxY: 200 },
    { minX: 200, maxX: 500, minY: -300, maxY: 0 },
    { minX: -400, maxX: 0, minY: -600, maxY: -400 },
    { minX: -200, maxX: 200, minY: 400, maxY: 700 },
  ];

  for (let i = 0; i < GARBAGE_BAG_COUNT; i++) {
    let x, y, z;
    let validPosition = false;
    let attempts = 0;

    while (!validPosition && attempts < 50) {
      const roadArea = roadAreas[Math.floor(Math.random() * roadAreas.length)];

      x = roadArea.minX + Math.random() * (roadArea.maxX - roadArea.minX);
      y = roadArea.minY + Math.random() * (roadArea.maxY - roadArea.minY);

      z = 25 + Math.random() * 5;

      const distFromDepot = getDistance(
        x,
        y,
        z,
        GARBAGE_DEPOT.x,
        GARBAGE_DEPOT.y,
        GARBAGE_DEPOT.z
      );

      if (distFromDepot > GARBAGE_BAG_EXCLUSION_RADIUS) {
        validPosition = true;
      }

      attempts++;
    }

    if (!validPosition) continue;

    const garbageBag = mp.objects.new(
      mp.joaat(GARBAGE_BAG_MODEL),
      new mp.Vector3(x, y, z),
      {
        rotation: new mp.Vector3(0, 0, Math.random() * 360),
        dimension: player.dimension,
      }
    );

    const blip = mp.blips.new(1, new mp.Vector3(x, y, z), {
      name: "Garbage Bag",
      color: 2,
      shortRange: true,
      scale: 0.8,
      dimension: player.dimension,
    });

    player.garbageBags.push(garbageBag);
    player.garbageBlips.push(blip);

    garbageBag.bagId = i;
    blip.bagId = i;

    garbageBag.setVariable("owner", player.id);
    blip.setVariable("owner", player.id);
  }

  player.outputChatBox(
    `${player.garbageBags.length} garbage bags have been marked on your map. Collect them all!`
  );

  const bagPositions = player.garbageBags.map((bag) => {
    return {
      id: bag.bagId,
      x: bag.position.x,
      y: bag.position.y,
      z: bag.position.z,
    };
  });

  player.call("garbageJob:bagsSpawned", [JSON.stringify(bagPositions)]);
}

function pickupGarbageBag(player, bagId) {
  if (typeof bagId !== "number" || bagId < 0) {
    return;
  }

  if (player.getVariable("currentJob") !== "garbage") {
    return;
  }

  if (player.getVariable("carryingBag") === true) {
    player.outputChatBox("You are already carrying a garbage bag.");
    return;
  }

  if (!player.garbageBags || !Array.isArray(player.garbageBags)) {
    return;
  }

  const bagIndex = player.garbageBags.findIndex((bag) => bag.bagId === bagId);

  if (bagIndex === -1) {
    return;
  }

  const bag = player.garbageBags[bagIndex];
  const blip = player.garbageBlips[bagIndex];

  player.garbageBags.splice(bagIndex, 1);
  player.garbageBlips.splice(bagIndex, 1);

  if (mp.objects.exists(bag)) {
    bag.destroy();
  }

  if (mp.blips.exists(blip)) {
    blip.destroy();
  }

  player.setVariable("carryingBag", true);

  player.outputChatBox("You picked up a garbage bag. Take it to your truck!");

  player.call("garbageJob:bagPickedUp", [bagId]);
}

function cleanupGarbageBags(player) {
  if (!player) {
    return;
  }

  if (player.garbageBags && player.garbageBags.length > 0) {
    player.garbageBags.forEach((bag) => {
      if (bag && mp.objects.exists(bag)) {
        bag.destroy();
      }
    });
    player.garbageBags = [];
  }

  if (player.garbageBlips && player.garbageBlips.length > 0) {
    player.garbageBlips.forEach((blip) => {
      if (blip && mp.blips.exists(blip)) {
        blip.destroy();
      }
    });
    player.garbageBlips = [];
  }
}

function getDistance(x1, y1, z1, x2, y2, z2) {
  return Math.sqrt(
    Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2) + Math.pow(z2 - z1, 2)
  );
}

initialize();

function depositGarbageBag(player) {
  if (player.getVariable("currentJob") !== "garbage") {
    return;
  }

  if (player.getVariable("carryingBag") !== true) {
    player.outputChatBox("You are not carrying a garbage bag.");
    return;
  }

  player.setVariable("carryingBag", false);

  const bagsCollected = player.getVariable("bagsCollected") || 0;
  const newBagsCollected = bagsCollected + 1;
  player.setVariable("bagsCollected", newBagsCollected);

  player.outputChatBox(
    `Bag deposited in truck. Total bags collected: ${newBagsCollected}`
  );

  if (newBagsCollected >= GARBAGE_BAG_COUNT) {
    endGarbageJob(player, true);
  }
}

function adjustBagZ(player, bagId, newZ) {
  if (typeof bagId !== "number" || bagId < 0 || typeof newZ !== "number") {
    return;
  }

  if (player.getVariable("currentJob") !== "garbage") {
    return;
  }

  if (!player.garbageBags || !Array.isArray(player.garbageBags)) {
    return;
  }

  const bag = player.garbageBags.find((bag) => bag.bagId === bagId);

  if (!bag || !mp.objects.exists(bag)) {
    return;
  }

  const currentPos = bag.position;
  bag.position = new mp.Vector3(currentPos.x, currentPos.y, newZ);
}

function savePlayerOutfit(player) {
  if (!player) {
    return;
  }

  try {
    const originalOutfit = {
      masks: player.getClothes(1).drawable,
      hair: player.getClothes(2).drawable,
      torso: player.getClothes(3).drawable,
      legs: player.getClothes(4).drawable,
      bags: player.getClothes(5).drawable,
      feet: player.getClothes(6).drawable,
      accessories: player.getClothes(7).drawable,
      undershirt: player.getClothes(8).drawable,
      bodyArmor: player.getClothes(9).drawable,
      decals: player.getClothes(10).drawable,
      tops: player.getClothes(11).drawable,
      masksTexture: player.getClothes(1).texture,
      hairTexture: player.getClothes(2).texture,
      torsoTexture: player.getClothes(3).texture,
      legsTexture: player.getClothes(4).texture,
      bagsTexture: player.getClothes(5).texture,
      feetTexture: player.getClothes(6).texture,
      accessoriesTexture: player.getClothes(7).texture,
      undershirtTexture: player.getClothes(8).texture,
      bodyArmorTexture: player.getClothes(9).texture,
      decalsTexture: player.getClothes(10).texture,
      topsTexture: player.getClothes(11).texture,
    };

    player.originalOutfit = originalOutfit;
  } catch (error) {
    console.error(`[SERVER] Error saving player outfit: ${error.message}`);
  }
}

function applyGarbageWorkerOutfit(player) {
  if (!player) {
    return;
  }

  const isMale = player.model === mp.joaat("mp_m_freemode_01");

  try {
    if (isMale) {
      player.setClothes(3, 14, 0, 0);
      player.setClothes(4, 36, 0, 0);
      player.setClothes(6, 12, 0, 0);
      player.setClothes(8, 59, 0, 0);
      player.setClothes(11, 56, 0, 0);
      player.setClothes(1, 0, 0, 0);
      player.setClothes(5, 0, 0, 0);
      player.setClothes(9, 0, 0, 0);
      player.setClothes(10, 0, 0, 0);
      player.setProp(0, 46, 0);
    } else {
      player.setClothes(3, 15, 0, 0);
      player.setClothes(4, 35, 0, 0);
      player.setClothes(6, 26, 0, 0);
      player.setClothes(8, 36, 0, 0);
      player.setClothes(11, 49, 0, 0);
      player.setClothes(1, 0, 0, 0);
      player.setClothes(5, 0, 0, 0);
      player.setClothes(9, 0, 0, 0);
      player.setClothes(10, 0, 0, 0);
      player.setProp(0, 45, 0);
    }

    player.outputChatBox(
      "You have been given a garbage worker uniform for the job."
    );
  } catch (error) {
    console.error(
      `[SERVER] Error applying garbage worker outfit: ${error.message}`
    );
  }
}

function restorePlayerOutfit(player) {
  if (!player) {
    return;
  }

  if (!player.originalOutfit) {
    return;
  }

  try {
    const outfit = player.originalOutfit;

    player.setClothes(1, outfit.masks, outfit.masksTexture, 0);
    player.setClothes(2, outfit.hair, outfit.hairTexture, 0);
    player.setClothes(3, outfit.torso, outfit.torsoTexture, 0);
    player.setClothes(4, outfit.legs, outfit.legsTexture, 0);
    player.setClothes(5, outfit.bags, outfit.bagsTexture, 0);
    player.setClothes(6, outfit.feet, outfit.feetTexture, 0);
    player.setClothes(7, outfit.accessories, outfit.accessoriesTexture, 0);
    player.setClothes(8, outfit.undershirt, outfit.undershirtTexture, 0);
    player.setClothes(9, outfit.bodyArmor, outfit.bodyArmorTexture, 0);
    player.setClothes(10, outfit.decals, outfit.decalsTexture, 0);
    player.setClothes(11, outfit.tops, outfit.topsTexture, 0);

    player.setProp(0, -1, 0);

    player.outputChatBox("Your original clothes have been restored.");

    player.originalOutfit = null;
  } catch (error) {
    console.error(`[SERVER] Error restoring original outfit: ${error.message}`);
  }
}

function cleanup() {
  if (global.garbageNPC && mp.peds.exists(global.garbageNPC)) {
    global.garbageNPC.destroy();
  }

  if (global.jobBlip && mp.blips.exists(global.jobBlip)) {
    global.jobBlip.destroy();
  }
}

exports = {
  startGarbageJob,
  endGarbageJob,
  pickupGarbageBag,
  depositGarbageBag,
  adjustBagZ,
  savePlayerOutfit,
  applyGarbageWorkerOutfit,
  restorePlayerOutfit,
  cleanup,
};
