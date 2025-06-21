global.AuthManager = require("../auth/index.js");

class CoordinateManager {
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

class VehicleManager {
  constructor() {
    this.vehicles = {
      sultan: "sultan",
      kuruma: "kuruma",
      adder: "adder",
      zentorno: "zentorno",
      entityxf: "entityxf",
      t20: "t20",
      osiris: "osiris",
      x80: "x80proto",
      vagner: "vagner",
      deveste: "deveste",
      thrax: "thrax",
      emerus: "emerus",
      kreiger: "kreiger",
      s80: "s80",
      pariah: "pariah",
      italigtb: "italigtb",
      italigtb2: "italigtb2",
      nero: "nero",
      nero2: "nero2",
      tempesta: "tempesta",
      reaper: "reaper",
      fmj: "fmj",
      bullet: "bullet",
      cheetah: "cheetah",
      comet: "comet",
      comet2: "comet2",
      comet3: "comet3",
      comet4: "comet4",
      comet5: "comet5",
      comet6: "comet6",
      comet7: "comet7",
      elegy: "elegy",
      elegy2: "elegy2",
      massacro: "massacro",
      massacro2: "massacro2",
      jester: "jester",
      jester2: "jester2",
      jester3: "jester3",
      turismo: "turismo",
      infernus: "infernus",
      vacca: "vacca",
      dominator: "dominator",
      dominator2: "dominator2",
      dominator3: "dominator3",
      gauntlet: "gauntlet",
      gauntlet2: "gauntlet2",
      gauntlet3: "gauntlet3",
      gauntlet4: "gauntlet4",
      gauntlet5: "gauntlet5",
      bati: "bati",
      bati2: "bati2",
      hakuchou: "hakuchou",
      hakuchou2: "hakuchou2",
      double: "double",
      fcr: "fcr",
      fcr2: "fcr2",
      sanchez: "sanchez",
      sanchez2: "sanchez2",
      bf400: "bf400",
      faggio: "faggio",
      faggio2: "faggio2",
      faggio3: "faggio3",
    };
  }

  spawnVehicle(player, vehicleName) {
    try {
      const vehicleModel = this.vehicles[vehicleName.toLowerCase()];

      if (!vehicleModel) {
        const availableVehicles = Object.keys(this.vehicles)
          .slice(0, 10)
          .join(", ");
        player.outputChatBox(
          `!{red}[ERROR]!{white} Vehicle not found. Try: ${availableVehicles}`
        );
        return;
      }

      const pos = player.position;
      const heading = player.heading;

      const spawnPos = new mp.Vector3(
        pos.x + Math.sin((-heading * Math.PI) / 180) * 3,
        pos.y + Math.cos((-heading * Math.PI) / 180) * 3,
        pos.z
      );

      const vehicle = mp.vehicles.new(mp.joaat(vehicleModel), spawnPos, {
        heading: heading,
        numberPlate: "RAGE",
        locked: false,
        engine: true,
      });

      player.putIntoVehicle(vehicle, 0);

      player.outputChatBox(
        `!{green}[VEHICLE]!{white} Spawned ${vehicleName} successfully!`
      );
    } catch (error) {
      console.error(`[VEHICLE ERROR] ${error}`);
      player.outputChatBox(
        `!{red}[ERROR]!{white} Failed to spawn vehicle. Try a different one.`
      );
    }
  }

  listVehicles(player) {
    const vehicleList = Object.keys(this.vehicles).join(", ");
    player.outputChatBox(
      `!{yellow}[VEHICLES]!{white} Available vehicles: ${vehicleList}`
    );
  }

  deleteVehicle(player) {
    const vehicle = player.vehicle;
    if (vehicle) {
      vehicle.destroy();
      player.outputChatBox(`!{green}[VEHICLE]!{white} Vehicle deleted!`);
    } else {
      player.outputChatBox(`!{red}[ERROR]!{white} You're not in a vehicle!`);
    }
  }
}

class VehicleRentalSystem {
  constructor() {
    this.rentalPED = null;
    this.rentalLocation = { x: -600.23, y: 25.41, z: 43.0 };
    this.tempVehicles = new Map();
    this.rentalVehicles = ["faggio"];
    this.rentalDuration = 200;
    this.rentalTextLabel = null;
    this.init();
  }

  init() {
    this.createRentalPED();
    this.createRentalTextLabel();
    this.setupEventHandlers();
  }

  createRentalPED() {
    try {
      const modelHash = mp.joaat("a_m_m_business_01");

      this.rentalPED = mp.peds.new(
        modelHash,
        new mp.Vector3(
          this.rentalLocation.x,
          this.rentalLocation.y,
          this.rentalLocation.z
        ),
        {
          heading: 180.0,
          dynamic: false,
          frozen: true,
          invincible: true,
        }
      );

      if (!this.rentalPED) {
        console.error(`[RENTAL ERROR] Failed to create PED`);
        return;
      }
    } catch (error) {
      console.error(`[RENTAL ERROR] Failed to create PED: ${error}`);
    }
  }

  createRentalTextLabel() {
    try {
      this.rentalTextLabel = mp.labels.new(
        "Press ~y~E~w~ to get rental vehicle",
        new mp.Vector3(
          this.rentalLocation.x,
          this.rentalLocation.y,
          this.rentalLocation.z + 1.5
        ),
        {
          los: false,
          font: 4,
          drawDistance: 5,
          color: [255, 255, 255, 255],
        }
      );
    } catch (error) {
      console.error(`[RENTAL ERROR] Failed to create text label: ${error}`);
    }
  }

  setupEventHandlers() {
    mp.events.add("playerEnterVehicle", (player, vehicle, seat) => {
      this.onPlayerEnterVehicle(player, vehicle);
    });

    mp.events.add("playerExitVehicle", (player, vehicle) => {
      this.onPlayerExitVehicle(player, vehicle);
    });

    mp.events.add("playerDeath", (player) => {
      this.destroyPlayerRental(player);
    });

    mp.events.add("playerQuit", (player) => {
      this.destroyPlayerRental(player);
    });
  }

  onPlayerEnterVehicle(player, vehicle) {
    const rentalData = this.tempVehicles.get(player.id);
    if (rentalData && rentalData.vehicle === vehicle) {
      this.stopTimer(player);
      player.call("rental:stopTimer");
      player.outputChatBox(`!{green}[RENTAL]!{white} Vehicle rental resumed!`);
    }
  }

  onPlayerExitVehicle(player, vehicle) {
    const rentalData = this.tempVehicles.get(player.id);
    if (rentalData && rentalData.vehicle === vehicle) {
      this.startTimer(player);
      player.outputChatBox(
        `!{yellow}[RENTAL]!{white} You have 200 seconds to return to your vehicle!`
      );
    }
  }

  startTimer(player) {
    const rentalData = this.tempVehicles.get(player.id);
    if (!rentalData) return;

    let timeLeft = this.rentalDuration;

    this.stopTimer(player);

    rentalData.timer = timeLeft;
    rentalData.interval = setInterval(() => {
      timeLeft--;
      rentalData.timer = timeLeft;

      player.call("rental:updateTimer", [timeLeft]);

      if (timeLeft <= 0) {
        this.destroyPlayerRental(player);
        player.outputChatBox(
          `!{red}[RENTAL]!{white} Your rental vehicle has expired!`
        );
        player.call("rental:stopTimer");
      }
    }, 1000);
  }

  stopTimer(player) {
    const rentalData = this.tempVehicles.get(player.id);
    if (rentalData && rentalData.interval) {
      clearInterval(rentalData.interval);
      rentalData.interval = null;
    }
  }

  destroyPlayerRental(player) {
    const rentalData = this.tempVehicles.get(player.id);
    if (rentalData) {
      this.stopTimer(player);
      if (rentalData.vehicle) {
        rentalData.vehicle.destroy();
      }
      this.tempVehicles.delete(player.id);
      player.call("rental:stopTimer");
    }
  }

  giveRentalVehicle(player) {
    if (this.tempVehicles.has(player.id)) {
      player.outputChatBox(
        `!{red}[RENTAL]!{white} You already have a rental vehicle!`
      );
      return;
    }

    try {
      const pos = player.position;
      const heading = player.heading;

      const spawnPos = new mp.Vector3(
        pos.x + Math.sin((-heading * Math.PI) / 180) * 3,
        pos.y + Math.cos((-heading * Math.PI) / 180) * 3,
        pos.z
      );

      const vehicle = mp.vehicles.new(mp.joaat("faggio"), spawnPos, {
        heading: heading,
        numberPlate: "RENTAL",
        locked: false,
        engine: true,
        color: [
          [255, 0, 0],
          [255, 0, 0],
        ],
      });

      this.tempVehicles.set(player.id, {
        vehicle: vehicle,
        timer: this.rentalDuration,
        interval: null,
      });

      player.putIntoVehicle(vehicle, 0);

      player.outputChatBox(
        `!{green}[RENTAL]!{white} You got a red faggio! Exit vehicle to start 200s timer.`
      );
    } catch (error) {
      console.error(`[RENTAL ERROR] ${error}`);
      player.outputChatBox(
        `!{red}[ERROR]!{white} Failed to give rental vehicle.`
      );
    }
  }

  isPlayerNearRentalPED(player) {
    if (!this.rentalPED) {
      return false;
    }

    try {
      const pedPos = this.rentalPED.position;
      const playerPos = player.position;

      const dx = playerPos.x - pedPos.x;
      const dy = playerPos.y - pedPos.y;
      const dz = playerPos.z - pedPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const isNear = distance <= 5.0;

      return isNear;
    } catch (error) {
      console.error(`[RENTAL ERROR] Error checking distance: ${error}`);
      return false;
    }
  }
}

const coordManager = new CoordinateManager();
const vehicleManager = new VehicleManager();
const rentalSystem = new VehicleRentalSystem();

mp.events.addCommand("coords", (player) => {
  coordManager.getCoordinates(player);
});

mp.events.addCommand("veh", (player, _, vehicleName) => {
  if (vehicleName) {
    vehicleManager.spawnVehicle(player, vehicleName);
  } else {
    player.outputChatBox(`!{red}[ERROR]!{white} Usage: /veh <vehicle_name>`);
    player.outputChatBox(
      `!{yellow}[TIP]!{white} Try: /veh sultan, /veh adder, /veh bati`
    );
  }
});

mp.events.addCommand("vehicles", (player) => {
  vehicleManager.listVehicles(player);
});

mp.events.addCommand("delcar", (player) => {
  vehicleManager.deleteVehicle(player);
});

mp.events.add("playerCommand", (player, command) => {
  if (command === "rental" || command === "e") {
    if (rentalSystem.isPlayerNearRentalPED(player)) {
      rentalSystem.giveRentalVehicle(player);
    } else {
      player.outputChatBox(
        `!{red}[RENTAL]!{white} You're not near the rental PED!`
      );
      player.outputChatBox(
        `!{yellow}[TIP]!{white} Use /checkped to see PED location and distance`
      );
    }
  }

  if (command === "checkped") {
    const ped = rentalSystem.rentalPED;
    if (ped) {
      const pedPos = ped.position;
      const playerPos = player.position;

      const dx = playerPos.x - pedPos.x;
      const dy = playerPos.y - pedPos.y;
      const dz = playerPos.z - pedPos.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      player.outputChatBox(
        `!{yellow}[PED DEBUG]!{white} PED exists at: ${pedPos.x.toFixed(
          2
        )}, ${pedPos.y.toFixed(2)}, ${pedPos.z.toFixed(2)}`
      );
      player.outputChatBox(
        `!{yellow}[PED DEBUG]!{white} Your position: ${playerPos.x.toFixed(
          2
        )}, ${playerPos.y.toFixed(2)}, ${playerPos.z.toFixed(2)}`
      );
      player.outputChatBox(
        `!{yellow}[PED DEBUG]!{white} Distance to PED: ${distance.toFixed(
          2
        )} meters`
      );
      player.outputChatBox(`!{yellow}[PED DEBUG]!{white} PED ID: ${ped.id}`);

      if (distance <= 5.0) {
        player.outputChatBox(
          `!{green}[PED DEBUG]!{white} You are close enough to interact!`
        );
      } else {
        player.outputChatBox(
          `!{red}[PED DEBUG]!{white} You are too far away (need to be within 5 meters)`
        );
      }
    } else {
      player.outputChatBox(`!{red}[PED DEBUG]!{white} PED does not exist!`);
    }
  }
});

mp.events.add("rental:interact", (player) => {
  if (rentalSystem.isPlayerNearRentalPED(player)) {
    rentalSystem.giveRentalVehicle(player);
  } else {
    player.outputChatBox(
      `!{red}[RENTAL]!{white} You're not near the rental PED!`
    );
    player.outputChatBox(
      `!{yellow}[TIP]!{white} Use /checkped to see PED location and distance`
    );
  }
});

mp.events.addCommand("help", (player) => {
  player.outputChatBox(`!{yellow}[AVAILABLE COMMANDS]!{white}`);
  player.outputChatBox(`!{cyan}/coords!{white} - Get your current coordinates`);
  player.outputChatBox(`!{cyan}/veh <name>!{white} - Spawn a vehicle`);
  player.outputChatBox(`!{cyan}/vehicles!{white} - List available vehicles`);
  player.outputChatBox(`!{cyan}/delcar!{white} - Delete current vehicle`);
  player.outputChatBox(
    `!{cyan}/checkped!{white} - Debug PED location and status`
  );
  player.outputChatBox(`!{yellow}[RENTAL SYSTEM]!{white}`);
  player.outputChatBox(
    `!{cyan}Go to rental PED and type /e!{white} - Get temporary vehicle`
  );
  player.outputChatBox(
    `!{cyan}Exit vehicle!{white} - Starts 200s countdown timer`
  );
  player.outputChatBox(
    `!{cyan}Re-enter vehicle!{white} - Stops timer and resumes rental`
  );
});

mp.events.add("playerJoin", (player) => {
  console.log(`Player ${player.name} joined the server`);
});

mp.events.add("playerQuit", (player) => {
  console.log(`Player ${player.name} left the server`);
});
