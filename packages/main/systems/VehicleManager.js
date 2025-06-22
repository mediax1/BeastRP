const vehicleConfig = require("../config/vehicles.js");

class VehicleManager {
  constructor() {
    this.vehicles = vehicleConfig.vehicles;
    this.spawnSettings = vehicleConfig.spawnSettings;
  }

  init() {
    this.setupCommands();
  }

  setupCommands() {
    mp.events.addCommand("veh", (player, _, vehicleName) => {
      if (vehicleName) {
        this.spawnVehicle(player, vehicleName);
      } else {
        player.outputChatBox(
          `!{red}[ERROR]!{white} Usage: /veh <vehicle_name>`
        );
        player.outputChatBox(
          `!{yellow}[TIP]!{white} Try: /veh sultan, /veh adder, /veh bati`
        );
      }
    });

    mp.events.addCommand("vehicles", (player) => {
      this.listVehicles(player);
    });

    mp.events.addCommand("delcar", (player) => {
      this.deleteVehicle(player);
    });
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
        pos.x +
          Math.sin((-heading * Math.PI) / 180) * this.spawnSettings.distance,
        pos.y +
          Math.cos((-heading * Math.PI) / 180) * this.spawnSettings.distance,
        pos.z
      );

      const vehicle = mp.vehicles.new(mp.joaat(vehicleModel), spawnPos, {
        heading: heading,
        numberPlate: this.spawnSettings.numberPlate,
        locked: this.spawnSettings.locked,
        engine: this.spawnSettings.engine,
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

// Create singleton instance
const vehicleManager = new VehicleManager();

module.exports = vehicleManager;
