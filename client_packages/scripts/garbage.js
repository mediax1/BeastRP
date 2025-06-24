const GARBAGE_DEPOT = new mp.Vector3(-321.7, -1545.9, 31.0);

const INTERACTION_DISTANCE = 2.0;
const GARBAGE_BAG_INTERACTION_DISTANCE = 3.0;
const GARBAGE_TRUCK_INTERACTION_DISTANCE = 3.0;

const PICKUP_ANIM_DICT = "anim@move_m@trash";
const PICKUP_ANIM_NAME = "pickup";

let isNearNPC = false;
let isOnGarbageJob = false;
let carryingBag = false;
let isNearTruck = false;
let isNearQuitCheckpoint = false;
let nearbyBags = [];
let garbageBags = [];
let playerTruck = null;
let jobStartTime = null;
let jobEndTime = null;
let quitCheckpoint = null;
let isInTruck = false;
let vehicleExitTimer = null;
let vehicleExitTime = null;
let vehicleTimerActive = false;

let npcLabel = null;

let toastBrowser = null;

function initialize() {
  createNPCLabel();

  mp.events.add("render", onRender);
  mp.events.add("garbageJob:started", onJobStarted);
  mp.events.add("garbageJob:ended", onJobEnded);
  mp.events.add("garbageJob:bagsSpawned", onBagsSpawned);
  mp.events.add("garbageJob:bagPickedUp", onBagPickedUp);
  mp.events.add("garbageJob:truckAssigned", onTruckAssigned);
  mp.events.add("playerEnterVehicle", onPlayerEnterVehicle);
  mp.events.add("playerLeaveVehicle", onPlayerLeaveVehicle);
  mp.events.add("garbageJob:timerExpired", onVehicleTimerExpired);
  mp.events.add("garbageJob:timerClosed", onVehicleTimerClosed);

  mp.events.add("garbageJob:confirmQuit", confirmQuitJob);
  mp.events.add("garbageJob:cancelQuit", cancelQuitJob);

  mp.keys.bind(0x45, false, onInteractionKeyPressed);
  mp.keys.bind(0x4b, false, onTruckInteractionKeyPressed);

  mp.game.streaming.requestAnimDict(PICKUP_ANIM_DICT);
}

function createNPCLabel() {
  npcLabel = mp.labels.new(
    "Press [E] to Start Garbage Job",
    new mp.Vector3(GARBAGE_DEPOT.x, GARBAGE_DEPOT.y, GARBAGE_DEPOT.z + 1.0),
    {
      los: true,
      font: 4,
      drawDistance: 10.0,
      color: [255, 0, 0, 255],
      dimension: 0,
    }
  );
}

function onRender() {
  const playerPos = mp.players.local.position;

  const distance = mp.game.gameplay.getDistanceBetweenCoords(
    playerPos.x,
    playerPos.y,
    playerPos.z,
    GARBAGE_DEPOT.x,
    GARBAGE_DEPOT.y,
    GARBAGE_DEPOT.z,
    true
  );

  const wasNearNPC = isNearNPC;
  isNearNPC = distance <= INTERACTION_DISTANCE;

  if (npcLabel) {
    npcLabel.visible = isNearNPC && !isOnGarbageJob;
  }

  if (isOnGarbageJob && quitCheckpoint && playerTruck) {
    const checkpointPos = quitCheckpoint.position;

    const checkpointDistance = mp.game.gameplay.getDistanceBetweenCoords(
      playerPos.x,
      playerPos.y,
      playerPos.z,
      checkpointPos.x,
      checkpointPos.y,
      checkpointPos.z,
      true
    );

    isInTruck =
      mp.players.local.vehicle && mp.players.local.vehicle === playerTruck;

    isNearQuitCheckpoint = checkpointDistance <= 5.0 && isInTruck;

    if (isNearQuitCheckpoint) {
      const time = new Date().getTime();
      const pulse = Math.sin(time / 250) * 0.1 + 0.9;

      mp.game.graphics.drawText(
        "Press [E] to Quit Garbage Job",
        [checkpointPos.x, checkpointPos.y, checkpointPos.z + 1.5],
        {
          font: 4,
          color: [255, 165, 0, 255],
          scale: [0.4 * pulse, 0.4 * pulse],
          outline: true,
          centre: true,
        }
      );
    }
  }

  if (isOnGarbageJob && carryingBag && playerTruck) {
    const truckDistance = mp.game.gameplay.getDistanceBetweenCoords(
      playerPos.x,
      playerPos.y,
      playerPos.z,
      playerTruck.position.x,
      playerTruck.position.y,
      playerTruck.position.z,
      true
    );

    isNearTruck = truckDistance <= GARBAGE_TRUCK_INTERACTION_DISTANCE;

    if (isNearTruck) {
      const time = new Date().getTime();
      const pulse = Math.sin(time / 250) * 0.1 + 0.9;

      mp.game.graphics.drawText(
        "Press [K] to Load Bag",
        [
          playerTruck.position.x,
          playerTruck.position.y,
          playerTruck.position.z + 1.5,
        ],
        {
          font: 4,
          color: [50, 205, 50, 255],
          scale: [0.35 * pulse, 0.35 * pulse],
          outline: true,
          centre: true,
        }
      );

      const screenX = 0.5;
      const screenY = 0.9;

      const alpha = Math.floor(pulse * 200);
      mp.game.graphics.drawRect(screenX, screenY, 0.25, 0.05, 0, 0, 0, alpha);

      mp.game.graphics.drawText("K", [screenX - 0.1, screenY - 0.008], {
        font: 4,
        color: [255, 255, 255, 255],
        scale: [0.5, 0.5],
        outline: false,
        centre: true,
      });

      mp.game.graphics.drawText("LOAD BAG", [screenX + 0.02, screenY - 0.008], {
        font: 4,
        color: [50, 205, 50, 255],
        scale: [0.4, 0.4],
        outline: false,
        centre: false,
      });
    }
  }

  if (isOnGarbageJob && !carryingBag) {
    nearbyBags = [];

    garbageBags.forEach((bag) => {
      const bagDistance = mp.game.gameplay.getDistanceBetweenCoords(
        playerPos.x,
        playerPos.y,
        playerPos.z,
        bag.x,
        bag.y,
        bag.z,
        true
      );

      if (bagDistance <= GARBAGE_BAG_INTERACTION_DISTANCE) {
        nearbyBags.push(bag);
      }
    });

    nearbyBags.forEach((bag) => {
      const time = new Date().getTime();
      const pulse = Math.sin(time / 250) * 0.1 + 0.9;

      mp.game.graphics.drawText(
        "Press [E] to Pick Up Bag",
        [bag.x, bag.y, bag.z + 0.5],
        {
          font: 4,
          color: [50, 205, 50, 255],
          scale: [0.35 * pulse, 0.35 * pulse],
          outline: true,
          centre: true,
        }
      );
    });
  }
}

function onInteractionKeyPressed() {
  if (isNearNPC && !isOnGarbageJob) {
    showJobConfirmationUI();
    return;
  }

  if (isOnGarbageJob && isNearQuitCheckpoint) {
    showQuitJobConfirmationUI();
    return;
  }

  if (isOnGarbageJob && !carryingBag && nearbyBags.length > 0) {
    const closestBag = nearbyBags[0];

    if (!garbageBags.find((bag) => bag.id === closestBag.id)) {
      return;
    }

    playPickupAnimation();

    showToastNotification("Bag picked up");

    mp.events.callRemote("garbageJob:pickupBag", closestBag.id);
  }
}

function playPickupAnimation() {
  mp.players.local.taskPlayAnim(
    PICKUP_ANIM_DICT,
    PICKUP_ANIM_NAME,
    8.0,
    -8.0,
    1000,
    1,
    0.0,
    false,
    false,
    false
  );
}

function showToastNotification(message) {
  if (toastBrowser) {
    toastBrowser.destroy();
  }

  toastBrowser = mp.browsers.new("package://ui/garbage_toast.html");

  setTimeout(() => {
    if (toastBrowser) {
      toastBrowser.execute(`updateToastMessage("${message}");`);
    }
  }, 100);
}

function showJobConfirmationUI() {
  mp.gui.cursor.visible = true;
  mp.events.call("garbageJob:showConfirmationUI");

  const browser = mp.browsers.new("package://ui/garbage_confirmation.html");

  global.garbageJobBrowser = browser;
}

function confirmJobStart() {
  mp.gui.cursor.visible = false;

  if (global.garbageJobBrowser) {
    global.garbageJobBrowser.destroy();
    global.garbageJobBrowser = null;
  }

  mp.events.callRemote("garbageJob:start");
}

function cancelJobStart() {
  mp.gui.cursor.visible = false;

  if (global.garbageJobBrowser) {
    global.garbageJobBrowser.destroy();
    global.garbageJobBrowser = null;
  }
}

function onJobStarted() {
  isOnGarbageJob = true;
  carryingBag = false;
  isNearTruck = false;
  isNearQuitCheckpoint = false;
  playerTruck = null;

  showToastNotification("You have been given a garbage worker uniform");

  jobStartTime = new Date();

  const checkpointPos = new mp.Vector3(-326.7, -1529.9, 27.5);

  mp.game.gameplay.getGroundZFor3dCoord(
    checkpointPos.x,
    checkpointPos.y,
    checkpointPos.z,
    0,
    false
  );
  const groundZ = mp.game.gameplay.getGroundZFor3dCoord(
    checkpointPos.x,
    checkpointPos.y,
    checkpointPos.z,
    0,
    false
  );

  checkpointPos.z = groundZ + 0.2;

  quitCheckpoint = mp.checkpoints.new(4, checkpointPos, 5.0, {
    color: [255, 165, 0, 150],
    visible: true,
    dimension: 0,
  });

  const quitBlip = mp.blips.new(358, checkpointPos, {
    name: "End Garbage Job",
    color: 1,
    shortRange: true,
    scale: 0.8,
  });

  quitCheckpoint.blip = quitBlip;

  showToastNotification("Garbage job started");
}

function onTruckAssigned(vehicleId) {
  playerTruck = mp.vehicles.at(vehicleId);

  if (mp.players.local.vehicle && mp.players.local.vehicle === playerTruck) {
    isInTruck = true;
  }
}

function onPlayerEnterVehicle(vehicle) {
  if (isOnGarbageJob && playerTruck && vehicle === playerTruck) {
    isInTruck = true;

    if (vehicleTimerActive) {
      stopVehicleExitTimer();
    }
  }
}

function onPlayerLeaveVehicle(vehicle) {
  if (isOnGarbageJob && playerTruck && vehicle === playerTruck) {
    isInTruck = false;

    startVehicleExitTimer();
  }
}

function startVehicleExitTimer() {
  vehicleExitTimer = mp.browsers.new("package://ui/garbage_timer.html");
  vehicleTimerActive = true;
}

function stopVehicleExitTimer() {
  if (vehicleExitTimer) {
    vehicleExitTimer.destroy();
    vehicleExitTimer = null;
  }

  vehicleTimerActive = false;
}

function onVehicleTimerExpired() {
  if (vehicleExitTimer) {
    vehicleExitTimer.destroy();
    vehicleExitTimer = null;
  }

  vehicleTimerActive = false;

  showToastNotification("You were away from your truck too long. Job ended.");

  mp.events.callRemote("garbageJob:end", false);
}

function onVehicleTimerClosed() {
  if (vehicleExitTimer) {
    vehicleExitTimer.destroy();
    vehicleExitTimer = null;
  }
}

function onTruckInteractionKeyPressed() {
  if (isOnGarbageJob && carryingBag && isNearTruck) {
    playBagLoadAnimation();

    carryingBag = false;
    mp.players.local.setVariable("carryingBag", false);

    mp.players.local.resetMovementClipset(0.3);

    mp.events.callRemote("garbageJob:depositBag");

    showToastNotification("Bag deposited in truck");
  }
}

function playBagLoadAnimation() {
  const LOAD_ANIM_DICT = "anim@heists@narcotics@trash";
  const LOAD_ANIM_NAME = "throw_b";

  mp.game.streaming.requestAnimDict(LOAD_ANIM_DICT);

  const startTime = new Date().getTime();
  const checkDictInterval = setInterval(() => {
    if (
      mp.game.streaming.hasAnimDictLoaded(LOAD_ANIM_DICT) ||
      new Date().getTime() - startTime > 1000
    ) {
      clearInterval(checkDictInterval);

      mp.players.local.taskPlayAnim(
        LOAD_ANIM_DICT,
        LOAD_ANIM_NAME,
        8.0,
        -8.0,
        1500,
        48,
        0.0,
        false,
        false,
        false
      );

      setTimeout(() => {
        const bagsCollected =
          mp.players.local.getVariable("bagsCollected") || 0;
        showToastNotification(`Bag loaded. Total: ${bagsCollected}`);
      }, 500);
    }
  }, 50);
}

function onBagsSpawned(bagsJson) {
  try {
    const rawBags = JSON.parse(bagsJson);

    garbageBags = rawBags.map((bag) => {
      const groundZ = mp.game.gameplay.getGroundZFor3dCoord(
        bag.x,
        bag.y,
        100,
        0,
        false
      );

      const adjustedZ =
        groundZ !== -Infinity && groundZ !== 0 ? groundZ + 0.2 : bag.z;

      if (groundZ !== -Infinity && groundZ !== 0) {
        mp.events.callRemote("garbageJob:adjustBagZ", bag.id, adjustedZ);
      }

      return {
        ...bag,
        z: adjustedZ,
      };
    });
  } catch (e) {
    console.log(`[ERROR] Failed to parse bag positions: ${e.message}`);
  }
}

function onBagPickedUp(bagId) {
  garbageBags = garbageBags.filter((bag) => bag.id !== bagId);
  carryingBag = true;
  mp.players.local.setVariable("carryingBag", true);

  mp.game.streaming.requestAnimSet("move_m@trash");

  const startTime = new Date().getTime();
  const checkAnimInterval = setInterval(() => {
    if (
      mp.game.streaming.hasAnimSetLoaded("move_m@trash") ||
      new Date().getTime() - startTime > 1000
    ) {
      clearInterval(checkAnimInterval);

      mp.players.local.setMovementClipset("move_m@trash", 0.5);
    }
  }, 50);
}

function onJobEnded(completed, bagsCollected, totalPayment) {
  isOnGarbageJob = false;
  carryingBag = false;
  isNearTruck = false;
  isInTruck = false;
  isNearQuitCheckpoint = false;
  playerTruck = null;
  garbageBags = [];
  nearbyBags = [];

  if (vehicleTimerActive) {
    stopVehicleExitTimer();
  }

  if (toastBrowser) {
    toastBrowser.destroy();
    toastBrowser = null;
  }

  if (global.garbageJobBrowser) {
    global.garbageJobBrowser.destroy();
    global.garbageJobBrowser = null;
  }

  if (global.garbageCompletionBrowser) {
    global.garbageCompletionBrowser.destroy();
    global.garbageCompletionBrowser = null;
  }

  if (global.garbageQuitBrowser) {
    global.garbageQuitBrowser.destroy();
    global.garbageQuitBrowser = null;
  }

  showToastNotification("Your original clothes have been restored");

  if (quitCheckpoint) {
    if (quitCheckpoint.blip) {
      quitCheckpoint.blip.destroy();
    }
    quitCheckpoint.destroy();
    quitCheckpoint = null;
  }

  mp.players.local.resetMovementClipset(0.3);

  jobEndTime = new Date();

  if (completed) {
    showJobCompletionUI(bagsCollected, totalPayment);
  }
}

function showJobCompletionUI(bagsCollected, totalPayment) {
  const jobDuration = Math.floor((jobEndTime - jobStartTime) / 1000);

  mp.game.controls.disableAllControlActions(0);

  mp.events.call("playMissionCompleteSound");

  mp.gui.cursor.visible = true;

  const browser = mp.browsers.new("package://ui/garbage_mission_complete.html");

  global.garbageCompletionBrowser = browser;

  setTimeout(() => {
    if (global.garbageCompletionBrowser) {
      global.garbageCompletionBrowser.execute(`
                    updateStats(${bagsCollected}, ${totalPayment}, ${jobDuration});
                `);
    }
  }, 500);

  mp.events.add("garbageJob:missionCompleteConfirmed", () => {
    closeJobCompletionUI();
  });
}

function closeJobCompletionUI() {
  mp.gui.cursor.visible = false;

  if (global.garbageCompletionBrowser) {
    global.garbageCompletionBrowser.destroy();
    global.garbageCompletionBrowser = null;
  }

  mp.game.controls.enableAllControlActions(0);

  mp.events.remove("garbageJob:missionCompleteConfirmed");
}

function showQuitJobConfirmationUI() {
  mp.gui.cursor.visible = true;

  const browser = mp.browsers.new(
    "package://ui/garbage_quit_confirmation.html"
  );

  global.garbageQuitBrowser = browser;

  const bagsCollected = mp.players.local.getVariable("bagsCollected") || 0;
  const totalPayment = bagsCollected * 100;

  setTimeout(() => {
    if (global.garbageQuitBrowser) {
      global.garbageQuitBrowser.execute(`
                    document.getElementById('bags-collected').textContent = ${bagsCollected};
                    document.getElementById('total-payment').textContent = '$${totalPayment}';
                `);
    }
  }, 100);
}

function closeQuitJobConfirmationUI() {
  mp.gui.cursor.visible = false;

  if (global.garbageQuitBrowser) {
    global.garbageQuitBrowser.destroy();
    global.garbageQuitBrowser = null;
  }
}

function confirmQuitJob() {
  closeQuitJobConfirmationUI();

  jobEndTime = new Date();

  const jobDuration = jobEndTime - jobStartTime;
  const minutes = Math.floor(jobDuration / 60000);
  const seconds = ((jobDuration % 60000) / 1000).toFixed(0);
  const formattedDuration = `${minutes}m ${seconds}s`;

  mp.events.callRemote("garbageJob:end", true);
}

function cancelQuitJob() {
  closeQuitJobConfirmationUI();
}

mp.events.add("garbageJob:confirmStart", confirmJobStart);
mp.events.add("garbageJob:cancelStart", cancelJobStart);
mp.events.add("garbageToast:complete", () => {
  if (toastBrowser) {
    toastBrowser.destroy();
    toastBrowser = null;
  }
});

initialize();
