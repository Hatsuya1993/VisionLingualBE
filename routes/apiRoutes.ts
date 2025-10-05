import express, { Router } from "express";
import * as AppError from "../controllers/errorController";
import * as apiController from "../controllers/apiController";
import multer from "multer"

const router: Router = express.Router();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

/**
 * PRIVATE ROUTES [Authorization required]
 */
router.post("/translate", apiController.translate);

router.post("/translate-progress", upload.single('image'), apiController.translateWithProgress);

router.post("/extractText", upload.single('image'), apiController.extractTextFromImage)

router.use(AppError.onInvalidEndpoint);

export default router;
