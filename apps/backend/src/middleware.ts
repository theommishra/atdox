import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { JWT_SECRET } from "@repo/backend-common/config";

export function middleware(req: Request, res: Response, next: NextFunction): void {
    try {
        const authHeader = req.headers["authorization"];
        if (!authHeader) {
            res.status(401).json({
                message: "No token provided"
            });
            return;
        }

        // Extract token from header
        const token = authHeader.startsWith('Bearer ') 
            ? authHeader.slice(7) 
            : authHeader;

        if (!token) {
            res.status(401).json({
                message: "No token provided"
            });
            return;
        }

        try {
            const decoded = jwt.verify(token, JWT_SECRET);
            if (decoded && typeof decoded === 'object' && 'userId' in decoded) {
                // @ts-ignore: TODO: Fix this
                req.userId = decoded.userId;
                next();
            } else {
                res.status(403).json({
                    message: "Invalid token format"
                });
            }
        } catch (jwtError) {
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