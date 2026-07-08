import { Router, type Request, type Response } from "express";

const router = Router();

/**
 * GET /api/health
 * Simple liveness check — useful for deployment health probes.
 */
router.get("/", (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: "ok",
    timestamp: new Date().toISOString(),
  });
});

export default router;
