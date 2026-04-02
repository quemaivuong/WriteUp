const express = require("express");
const router = express.Router();
router.use("/grade6", require("./grade6"));
router.use("/grade7", require("./grade7"));
router.use("/grade8", require("./grade8"));
// Grade 9-12 routes to be added after textbook review
module.exports = router;
