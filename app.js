const express = require("express");
const helmet = require("helmet"); // secure headers
const compression = require("compression"); // compress assets
const morgan = require("morgan"); // logging

/**
 * Controllers
 */
const AppError = require("./controllers/errorController");

/**
 * Routes
 */
const apiRoutes = require("./routes/apiRoutes");

const app = express();

/**
 * Middlewares
 */

app.use(helmet());
app.use(compression());

app.use("/v1/api", apiRoutes); // --- App Acccess
app.use(AppError.unAuthorised); // -- Error Handler

app.use((error, req, res, next) => {
  const status = error.statusCode || 500;
  const data = error.data;
  res.status(status).json({ data: data });
});

const PORT = process.env.PORT || 8000;
app.listen(PORT);
