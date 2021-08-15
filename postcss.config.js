const cssnano = require("cssnano");

const plugins = [process.env.NODE_ENV === "production" && cssnano].filter(
  Boolean
);

module.exports = { plugins };
