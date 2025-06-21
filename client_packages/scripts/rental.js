class RentalTimer {
  constructor() {
    this.timerActive = false;
    this.timeLeft = 0;
    this.timerDisplay = null;
    this.rentalPEDLocation = { x: -600.23, y: 25.41, z: 43.0 };
    this.init();
  }

  init() {
    this.createTimerDisplay();
    this.setupEventHandlers();
  }

  createTimerDisplay() {
    this.timerDisplay = mp.browsers.new("package://ui/rental_timer.html");
    this.timerDisplay.active = false;
  }

  setupEventHandlers() {
    mp.events.add("rental:updateTimer", (timeLeft) => {
      this.updateTimer(timeLeft);
    });

    mp.events.add("rental:stopTimer", () => {
      this.stopTimer();
    });

    mp.keys.bind(0x45, false, () => {
      if (this.isPlayerNearRentalPED()) {
        mp.events.callRemote("rental:interact");
      }
    });
  }

  isPlayerNearRentalPED() {
    try {
      const player = mp.players.local;
      const playerPos = player.position;

      const dx = playerPos.x - this.rentalPEDLocation.x;
      const dy = playerPos.y - this.rentalPEDLocation.y;
      const dz = playerPos.z - this.rentalPEDLocation.z;
      const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);

      const isNear = distance <= 5.0;

      return isNear;
    } catch (error) {
      console.error(
        "[CLIENT ERROR] Error checking distance to rental PED:",
        error
      );
      return false;
    }
  }

  updateTimer(timeLeft) {
    this.timeLeft = timeLeft;
    this.timerActive = true;

    if (!this.timerDisplay.active) {
      this.timerDisplay.active = true;
    }

    this.timerDisplay.execute(`updateTimer(${timeLeft});`);
  }

  stopTimer() {
    this.timerActive = false;
    this.timeLeft = 0;

    if (this.timerDisplay.active) {
      this.timerDisplay.active = false;
    }
  }

  getTimerStatus() {
    return {
      active: this.timerActive,
      timeLeft: this.timeLeft,
    };
  }
}

const rentalTimer = new RentalTimer();

global.rentalTimer = rentalTimer;
