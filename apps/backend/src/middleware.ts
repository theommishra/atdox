import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

// Extend Request interface to include userId
interface AuthenticatedRequest extends Request {
    userId?: number;
}

export function middleware(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
    try {
        console.log('=== MIDDLEWARE DEBUG ===');
        console.log('Request URL:', req.url);
        console.log('Request method:', req.method);
        console.log('All headers:', req.headers);
        console.log('Authorization header:', req.headers["authorization"]);
        
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            console.log('No authorization header found');
            res.status(401).json({
                message: "No token provided"
            });
            return;
        }

        // Extract token from header
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        console.log('Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');

        if (!token) {
            console.log('No token extracted from header');
            res.status(401).json({
                message: "No token provided"
            });
            return;
        }

        try {
            console.log('Verifying JWT token...');
            const decoded = jwt.verify(token, JWT_SECRET);
            console.log('JWT decoded successfully:', decoded);
            
            if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
                // @ts-ignore: TODO: Fix this
                req.userId = decoded.userId;
                console.log('User ID set in request:', req.userId);
                console.log('=== MIDDLEWARE SUCCESS ===');
                next();
            } else {
                console.log('Invalid token format:', decoded);
                res.status(403).json({
                    message: "Invalid token format"
                });
            }
        } catch (jwtError) {
            console.log('JWT verification failed:', jwtError);
            res.status(401).json({
                message: "Invalid token"
            });
        }
    } catch (error) {
        res.status(500).json({
            message: "Internal server error"
        });
    }
}