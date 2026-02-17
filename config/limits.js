/**
 * Pro/Free limits for tools.
 * Single-file tools: free 2MB, pro 5MB+ (capped at PRO_SINGLE_MAX).
 * Batch tools (compress pdf, images to pdf, etc.): free 7 files / 7MB total, pro 20MB total.
 */

const BYTES = (mb) => mb * 1024 * 1024;

// Single-file tools: corrupt, pdf-to-word, pdf-to-jpg, protect, unlock, ocr, pdf-to-ppt, ppt-to-pdf, pdf-to-excel, repair
const FREE_SINGLE_FILE_MAX = BYTES(2);
const PRO_SINGLE_FILE_MAX = BYTES(100);

// Batch tools: compress pdf, images to pdf (crop/compress images are client-side but use same limits in frontend)
const FREE_BATCH_FILES = 7;
const FREE_BATCH_TOTAL_MAX = BYTES(7);
const PRO_BATCH_FILES = 20;
const PRO_BATCH_TOTAL_MAX = BYTES(20);

function getSingleFileLimits(isPro) {
  return {
    maxFileSize: isPro ? PRO_SINGLE_FILE_MAX : FREE_SINGLE_FILE_MAX,
    isPro
  };
}

function getBatchLimits(isPro) {
  return {
    maxFiles: isPro ? PRO_BATCH_FILES : FREE_BATCH_FILES,
    maxTotalSize: isPro ? PRO_BATCH_TOTAL_MAX : FREE_BATCH_TOTAL_MAX,
    isPro
  };
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/** Call after multer; if file over limit, sends 400 and returns true (caller should return). */
function checkSingleFileLimit(req, res) {
  if (!req.file) return false;
  const isPro = !!req.isProUser;
  const { maxFileSize } = getSingleFileLimits(isPro);
  if (req.file.size <= maxFileSize) return false;
  const msg = isPro
    ? `File size exceeds ${formatBytes(maxFileSize)}.`
    : `Free users: single file must be ≤2MB. Your file is ${formatBytes(req.file.size)}. Upgrade to Pro for files up to ${formatBytes(maxFileSize)}.`;
  res.status(400).json({ success: false, message: msg, errorCode: 'FILE_TOO_LARGE_FREE' });
  return true;
}

module.exports = {
  FREE_SINGLE_FILE_MAX,
  PRO_SINGLE_FILE_MAX,
  FREE_BATCH_FILES,
  FREE_BATCH_TOTAL_MAX,
  PRO_BATCH_FILES,
  PRO_BATCH_TOTAL_MAX,
  getSingleFileLimits,
  getBatchLimits,
  checkSingleFileLimit,
  formatBytes: formatBytes
};
