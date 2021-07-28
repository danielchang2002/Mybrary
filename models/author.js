const mongoose = require("mongoose");

const authorScheme = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Author", authorScheme);
