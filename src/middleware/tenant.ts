import { Request, Response, NextFunction } from 'express';

// Mở rộng Request interface để chứa tenantId
declare module 'express-serve-static-core' {
  interface Request {
    tenantId?: string;
  }
}

export const requireTenantId = (req: Request, res: Response, next: NextFunction) => {
  const tenantId = req.headers['x-tenant-id'];

  if (!tenantId || typeof tenantId !== 'string') {
    return res.status(400).json({ 
      error: 'Missing or invalid x-tenant-id header. Multi-tenancy requires a tenant ID for this operation.' 
    });
  }

  req.tenantId = tenantId;
  next();
};
