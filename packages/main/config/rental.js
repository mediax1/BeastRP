module.exports = {
  ped: {
    model: "a_m_m_business_01",
    location: { x: -600.23, y: 25.41, z: 43.0 },
    heading: 180.0,
    dynamic: false,
    frozen: true,
    invincible: true,
  },

  textLabel: {
    text: "Press ~y~E~w~ to get rental vehicle",
    offset: 1.5,
    los: false,
    font: 4,
    drawDistance: 5,
    color: [255, 255, 255, 255],
  },

  interaction: {
    maxDistance: 5.0,
  },

  timer: {
    duration: 200,
    interval: 1000,
  },
};
