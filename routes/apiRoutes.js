const express = require("express");
const router = express.Router();
const AppError = require("../controllers/errorController");
const apiController = require("../controllers/apiController");

/**
 * PRIVATE ROUTES [Authorization required]
 */
router.get("/translate", apiController.translate);

router.use(AppError.onInvalidEndpoint);

module.exports = router;
