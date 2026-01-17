import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';


export const validation = (schema:ZodSchema)=>(req:Request, res:Response, next:NextFunction) => {
  try {
    schema.parse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    next(); 
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({
        status: 'fail',
        errors: e.issues.map(err => ({
          field: err.path[1], 
          message: err.message
        }))
      });
    }
    return res.status(500).send('Internal Server Error');
  }
};