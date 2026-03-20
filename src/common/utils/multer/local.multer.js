import multer from "multer";
import { resolve } from "node:path";
import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync } from "node:fs";
import { validationFileFilter } from './validation.multer.js';

export const localFileUpload = ({
  customPath = "general",
  validation = [],
  maxSize = 1
} = {}) => {

  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const fullPath = resolve(`../upload/${customPath}`);

      if (!existsSync(fullPath)) {
        mkdirSync(fullPath, { recursive: true });
      }
      cb(null, fullPath);
    },
    filename: (req, file, cb) => {
      const uniqName = randomUUID() + "_" + file.originalname;
      file.finalpath = `upload/${customPath}/${uniqName}`
      cb(null, uniqName);
    },
  });

  return multer({ fileFilter: validationFileFilter(validation), storage, limits: { fileSize: maxSize * 1024 * 1024 } });
};