require("dotenv").config();
const express = require("express");
const app = express();
app.use(express.json());
app.use("/api", require("./routes"));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`WriteUp server running on port ${PORT}`);
});
module.exports = app;
