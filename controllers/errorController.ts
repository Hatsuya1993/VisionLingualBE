import { Request, Response, NextFunction } from "express";

export const unAuthorised = (req: Request, res: Response, next: NextFunction): void => {
  res.status(401).json("Request not authorised to provide response!");
};

export const bodyMissing = (res: Response, msg: string = "Required fields are missing"): void => {
  //400 - bad request
  res.status(400).json(`Error: ${msg}`);
}

export const onError = (res: Response, msg: string = "Something went wrong"): void => {
  //503 - service un available
  res.json(`Error: ${msg}`);
};

export const onInvalidEndpoint = (res: Response): void => {
  res.json("Please use valid endpoints to access resourcse!");
};
