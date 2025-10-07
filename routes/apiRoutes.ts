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

router.post("/translate-progress", upload.single('image'), apiController.translateWithProgress);

router.post("/create-checkout-session", apiController.createCheckoutSession)

router.post("/verify-payment", apiController.verifyPayment)

router.post("/check-subscription", apiController.checkSubscription)


router.use(AppError.onInvalidEndpoint);

export default router;
