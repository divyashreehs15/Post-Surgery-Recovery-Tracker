import { Request, Response, NextFunction } from "express";

export function notFoundHandler(_req: Request, res: Response) {
	return res.status(404).json({ success: false, message: "Route not found" });
}

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
	const statusCode = err.status || err.statusCode || 500;
	const message = err.message || "Internal Server Error";
	const details = err.errors || undefined;
	return res.status(statusCode).json({ success: false, message, details });
}
