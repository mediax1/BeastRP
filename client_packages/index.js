require("./auth.js");

mp.events.add("render", () => {});

mp.events.add("playerCommand", (command) => {
  if (command === "testcursor") {
    console.log("Test: Setting cursor visible");
    mp.gui.cursor.visible = true;
    console.log("Test: Cursor visible state:", mp.gui.cursor.visible);
  }

  if (command === "testauth") {
    console.log("Test: Showing auth UI");
    mp.events.call("auth:showLoginUI");
  }
});
