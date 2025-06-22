const rentalConfig = require("../config/rental.js");
const vehicleConfig = require("../config/vehicles.js");

class VehicleRentalSystem {
  constructor() {
    this.rentalPED = null;
    this.rentalLocation = rentalConfig.ped.location;
    this.tempVehicles = new Map();
    this.rentalVehicles = vehicleConfig.rentalSettings.vehicles;
    this.rentalDuration = rentalConfig.timer.duration;
    this.rentalTextLabel = null;
  }

  init() {
    this.createRentalPED();
    this.createRentalTextLabel();
    this.setupEventHandlers();
    this.setupCommands();
  }

  createRentalPED() {
    try {
      const modelHash = mp.joaat(rentalConfig.ped.model);

      this.rentalPED = mp.peds.new(
        modelHash,
        new mp.Vector3(
          this.rentalLocation.x,
          this.rentalLocation.y,
          this.rentalLocation.z
        ),
        {
          heading: rentalConfig.ped.heading,
          dynamic: rentalConfig.ped.dynamic,
          frozen: rentalConfig.ped.frozen,
          invincible: rentalConfig.ped.invincible,
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
        rentalConfig.textLabel.text,
        new mp.Vector3(
          this.rentalLocation.x,
          this.rentalLocation.y,
          this.rentalLocation.z + rentalConfig.textLabel.offset
        ),
        {
          los: rentalConfig.textLabel.los,
          font: rentalConfig.textLabel.font,
          drawDistance: rentalConfig.textLabel.drawDistance,
          color: rentalConfig.textLabel.color,
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

    mp.events.add("rental:interact", (player) => {
      if (this.isPlayerNearRentalPED(player)) {
        this.giveRentalVehicle(player);
      } else {
        player.outputChatBox(
          `!{red}[RENTAL]!{white} You're not near the rental PED!`
        );
        player.outputChatBox(
          `!{yellow}[TIP]!{white} Use /checkped to see PED location and distance`
        );
      }
    });
  }

  setupCommands() {
    mp.events.add("playerCommand", (player, command) => {
      if (command === "rental" || command === "e") {
        if (this.isPlayerNearRentalPED(player)) {
          this.giveRentalVehicle(player);
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
        this.debugPEDLocation(player);
      }
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
        `!{yellow}[RENTAL]!{white} You have ${this.rentalDuration} seconds to return to your vehicle!`
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
    }, rentalConfig.timer.interval);
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
        pos.x +
          Math.sin((-heading * Math.PI) / 180) *
            vehicleConfig.spawnSettings.distance,
        pos.y +
          Math.cos((-heading * Math.PI) / 180) *
            vehicleConfig.spawnSettings.distance,
        pos.z
      );

      const vehicle = mp.vehicles.new(
        mp.joaat(this.rentalVehicles[0]),
        spawnPos,
        {
          heading: heading,
          numberPlate: vehicleConfig.rentalSettings.numberPlate,
          locked: vehicleConfig.spawnSettings.locked,
          engine: vehicleConfig.spawnSettings.engine,
          color: vehicleConfig.rentalSettings.color,
        }
      );

      this.tempVehicles.set(player.id, {
        vehicle: vehicle,
        timer: this.rentalDuration,
        interval: null,
      });

      player.putIntoVehicle(vehicle, 0);

      player.outputChatBox(
        `!{green}[RENTAL]!{white} You got a red ${this.rentalVehicles[0]}! Exit vehicle to start ${this.rentalDuration}s timer.`
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

      const isNear = distance <= rentalConfig.interaction.maxDistance;

      return isNear;
    } catch (error) {
      console.error(`[RENTAL ERROR] Error checking distance: ${error}`);
      return false;
    }
  }

  debugPEDLocation(player) {
    const ped = this.rentalPED;
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

      if (distance <= rentalConfig.interaction.maxDistance) {
        player.outputChatBox(
          `!{green}[PED DEBUG]!{white} You are close enough to interact!`
        );
      } else {
        player.outputChatBox(
          `!{red}[PED DEBUG]!{white} You are too far away (need to be within ${rentalConfig.interaction.maxDistance} meters)`
        );
      }
    } else {
      player.outputChatBox(`!{red}[PED DEBUG]!{white} PED does not exist!`);
    }
  }
}

// Create singleton instance
const vehicleRentalSystem = new VehicleRentalSystem();

module.exports = vehicleRentalSystem;
