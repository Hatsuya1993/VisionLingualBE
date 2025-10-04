import { Request, Response, NextFunction } from "express";
import * as AppError from "./errorController";
import { getBestTranslation, getBody } from "../helper/apiHelper";
import { log } from "node:console";

export const translate = async (req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>> => {  

  if (!req.body.query || !req.body.targetLanguage || !req.body.sourceLanguage) return AppError.bodyMissing(res, "Invalid request");

try {

  const response = await getBestTranslation(req.body.query, req.body.targetLanguage, req.body.sourceLanguage)
  return res.status(200).json(response);

} catch (error) {
  console.error(error);
}

};
