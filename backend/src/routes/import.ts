import { Router, type Request, type Response, type NextFunction } from "express";
import multer from "multer";
import { processImport } from "../services/importService.js";
import type { AppError } from "../middleware/errorHandler.js";

const router = Router();

// Store file in memory (stateless — no disk writes)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB max
  },
  fileFilter: (_req, file, cb) => {
    if (
      file.mimetype === "text/csv" ||
      file.mimetype === "application/vnd.ms-excel" ||
      file.originalname.toLowerCase().endsWith(".csv")
    ) {
      cb(null, true);
    } else {
      const err: AppError = new Error("Only CSV files are allowed");
      err.statusCode = 400;
      cb(err);
    }
  },
});

/**
 * POST /api/import
 * Accepts a CSV file upload (multipart/form-data field: "file")
 * Returns AI-extracted CRM records.
 */
router.post(
  "/",
  upload.single("file"),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) {
        const err: AppError = new Error("No file uploaded. Send a CSV as multipart field 'file'");
        err.statusCode = 400;
        return next(err);
      }

      const result = await processImport(req.file.buffer, req.file.originalname);

      return res.status(200).json({
        success: true,
        data: result,
      });
    } catch (err) {
      return next(err);
    }
  }
);

export default router;
