import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Mở rộng Request interface để chứa user payload từ token
declare module 'express-serve-static-core' {
  interface Request {
    user?: {
      email: string;
      role: string;
      tenantId?: string;
    };
  }
}

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey_12345';

export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    
    // Nếu API gọi kèm x-tenant-id, đảm bảo user này thuộc tenant đó (dành cho OWNER)
    const reqTenantId = req.headers['x-tenant-id'] as string;
    if (decoded.role === 'OWNER' && reqTenantId && decoded.tenantId !== reqTenantId) {
       return res.status(403).json({ error: 'Forbidden: You do not have access to this tenant' });
    }
    
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
};
