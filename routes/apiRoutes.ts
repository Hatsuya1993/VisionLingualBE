import express, { Router } from "express";
import * as AppError from "../controllers/errorController";
import * as apiController from "../controllers/apiController";

const router: Router = express.Router();

/**
 * PRIVATE ROUTES [Authorization required]
 */
router.post("/translate", apiController.translate);

router.use(AppError.onInvalidEndpoint);

export default router;
