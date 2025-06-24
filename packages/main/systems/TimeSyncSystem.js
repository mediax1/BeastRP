const minute = 60 * 1000;

function getISTDate() {
  const now = new Date();
  const istOffset = 5.5 * 60;
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + istOffset * 60000);
}

function setGameTimeToIST() {
  const ist = getISTDate();
  const hour = ist.getHours();
  const minute = ist.getMinutes();
  mp.world.time.set(hour, minute, 0);
  mp.players.forEach((player) => {
    player.call("updateISTTime", [hour, minute]);
  });
}

function sendISTTimeToPlayer(player) {
  const ist = getISTDate();
  const hour = ist.getHours();
  const minute = ist.getMinutes();
  player.call("updateISTTime", [hour, minute]);
}

function startISTSync() {
  setGameTimeToIST();
  setInterval(setGameTimeToIST, minute);
  mp.events.add("playerJoin", (player) => {
    sendISTTimeToPlayer(player);
  });
}

module.exports = { startISTSync };
