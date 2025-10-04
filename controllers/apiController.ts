import { Request, Response, NextFunction } from "express";
import * as AppError from "./errorController";
import { getBestTranslation, getBody, getExtractText } from "../helper/apiHelper";

export const translate = async (req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>> => {  

  if (!req.body.query || !req.body.targetLanguage) return AppError.bodyMissing(res, "Invalid request");

try {

  const response = await getBestTranslation(req.body.query, req.body.targetLanguage)
  return res.status(200).json(response);

} catch (error: any) {
  return AppError.serverError(res ,  error.message || "Something went wrong during translation");
}

};

export const extractTextFromImage = async (req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>> => {

  // Get data from FormData
  const imageFile = req.file;

  if (!imageFile) {
    return AppError.bodyMissing(res, "No image provided");
  }

  try {

  const response = await getExtractText(imageFile)
  
  return res.status(200).json(response);

  } catch (error: any) {
    return AppError.serverError(res, error.message || "Something went wrong during text extraction");
  }

}