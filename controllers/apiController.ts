import { Request, Response, NextFunction } from "express";
import * as AppError from "./errorController";

export const translate = (req: Request, res: Response, next: NextFunction): Response => {
  return res.json({ message: "Translate API" });

  // restaurant
  //   .save()
  //   .then((restaurant) => {
  //     return res.json(restaurant);
  //   })
  //   .catch((err) => {
  //     return AppError.onError(res, "restaurant add error" + err);
  //   });
};
