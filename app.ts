import express, { Application, Request, Response, NextFunction } from "express";
import helmet from "helmet"; // secure headers
import compression from "compression"; // compress assets
import cors from 'cors';
import dotenv from "dotenv";

/**
 * Controllers
 */
import * as AppError from "./controllers/errorController";

/**
 * Routes
 */
import apiRoutes from "./routes/apiRoutes";

dotenv.config();

const app: Application = express();

/**
 * Middlewares
 */

  // Enable CORS for your frontend
app.use(cors({
    origin: process.env.LOCALHOST // Your React app URL
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(helmet());
app.use(compression());

app.use("/v1/api", apiRoutes); // --- App Acccess
app.use(AppError.unAuthorised); // -- Error Handler

interface CustomError extends Error {
  statusCode?: number;
  data?: any;
}

app.use((error: CustomError, req: Request, res: Response, next: NextFunction) => {
  const status = error.statusCode || 500;
  const data = error.data;
  res.status(status).json({ data: data });
});

const PORT: number = Number(process.env.PORT) || 8000;
console.log(`Server running on port ${PORT}`);
app.listen(PORT);
