import { Request, Response, NextFunction } from "express";
import * as AppError from "./errorController";
import { getBestTranslation, getBody, getExtractText, getSourceLanguage, handleCheckingSubscription, handleStripeSession, handleVerifyingPayment } from "../helper/apiHelper";

export const translate = async (req: Request, res: Response, next: NextFunction): Promise<void | Response<any, Record<string, any>>> => {

  if (!req.body.query || !req.body.targetLanguage) return AppError.bodyMissing(res, "Invalid request");

try {

  const responseLanguage = await getSourceLanguage(req.body.query)

  const response = await getBestTranslation(req.body.query, req.body.targetLanguage, responseLanguage)
  return res.status(200).json(response);

} catch (error: any) {
  return AppError.serverError(res ,  error.message || "Something went wrong during translation");
}

};

export const translateWithProgress = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  // Get data from FormData
  const imageFile = req.file;

  if (!imageFile) {
    return AppError.bodyMissing(res, "No image provided");
  }

  if (!req.body.targetLanguage) {
    return AppError.bodyMissing(res, "Invalid request");
  }

  // Set up SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering for nginx/proxies

  const sendProgress = (progress: number, message: string) => {
    res.write(`data: ${JSON.stringify({ progress, message })}\n\n`);
    res.flush?.(); // Ensure data is sent immediately
  };

  try {

    sendProgress(10, "Extracting text from image...");
    const imageText = await getExtractText(imageFile)

    sendProgress(13, "Detecting source language...");
    const responseLanguage = await getSourceLanguage(imageText);

    sendProgress(50, "Translating...");
    const response = await getBestTranslation(imageText, req.body.targetLanguage, responseLanguage);

    sendProgress(100, "Translation complete");
    res.write(`data: ${JSON.stringify({ progress: 100, result: response })}\n\n`);
    res.end();

  } catch (error: any) {
    res.write(`data: ${JSON.stringify({ error: error.message || "Translation failed" })}\n\n`);
    res.end();
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

export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) : Promise<void> => {

  const YOUR_DOMAIN = 'http://localhost:5173';  

  if(req.body.plan === undefined) {
    return AppError.bodyMissing(res, "No plan provided");
  }  

  try {

    const session : any = await handleStripeSession(req.body.plan, YOUR_DOMAIN)

    res.status(200).json({url: session})

  } catch (error: any) {
    
    return AppError.bodyMissing(res, error.message || "Something went wrong during Stripe session")

  }


}

export const verifyPayment = async (req: Request, res: Response, next: NextFunction) => {

  const { sessionId } = req.body  

  if(sessionId === undefined) {
    return AppError.bodyMissing(res, "No sessionId provided");
  }  

  try {

    const session : any = await handleVerifyingPayment(sessionId)

    res.status(200).json(session)
    
  } catch (error: any) {

    return AppError.bodyMissing(res, error.message || "Something went wrong verifying payment")
    
  }


}

export const checkSubscription = async (req: Request, res: Response, next: NextFunction) => {

  if(!req.body.subscriptionId) {
    return AppError.bodyMissing(res, "No subscriptionId provided");
  }

  try {

    const subscription : any = await handleCheckingSubscription(req.body.subscriptionId)
    
    res.status(200).json(subscription)
    
  } catch (error : any) {
    
    return AppError.bodyMissing(res, error.message || "Something went wrong checking subscription")

  }

}