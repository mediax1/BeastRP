global.AuthManager = require("../auth/index.js");

const CoordinateManager = require("./systems/CoordinateManager.js");
const VehicleManager = require("./systems/VehicleManager.js");
const VehicleRentalSystem = require("./systems/VehicleRentalSystem.js");
const CommandsManager = require("./systems/CommandsManager.js");
const GarbageJob = require("../garbage/index.js");

CoordinateManager.init();
VehicleManager.init();
VehicleRentalSystem.init();
CommandsManager.init();

module.exports = {
  CoordinateManager,
  VehicleManager,
  VehicleRentalSystem,
  CommandsManager,
};
