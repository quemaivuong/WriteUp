const express = require("express");
const router = express.Router();
router.use("/grade6", require("./grade6"));
// Grade 7-12 routes to be added after textbook review
module.exports = router;
