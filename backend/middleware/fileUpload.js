const multer = require('multer');
const path = require('path');

// Configure multer for Excel file uploads
const storage = multer.memoryStorage();

const excelFileFilter = (req, file, cb) => {
  const allowedExtensions = ['.xlsx', '.xls'];
  const ext = path.extname(file.originalname).toLowerCase();

  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only Excel files (.xlsx, .xls) are allowed'), false);
  }
};

const uploadExcel = multer({
  storage: storage,
  fileFilter: excelFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max file size
  }
});

module.exports = { uploadExcel };
