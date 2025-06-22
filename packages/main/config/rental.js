module.exports = {
  // Rental PED settings
  ped: {
    model: "a_m_m_business_01",
    location: { x: -600.23, y: 25.41, z: 43.0 },
    heading: 180.0,
    dynamic: false,
    frozen: true,
    invincible: true,
  },

  // Text label settings
  textLabel: {
    text: "Press ~y~E~w~ to get rental vehicle",
    offset: 1.5,
    los: false,
    font: 4,
    drawDistance: 5,
    color: [255, 255, 255, 255],
  },

  // Interaction settings
  interaction: {
    maxDistance: 5.0,
  },

  // Timer settings
  timer: {
    duration: 200, // seconds
    interval: 1000, // milliseconds
  },
};
