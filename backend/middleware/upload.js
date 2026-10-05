const multer = require('multer');
const path = require('path');

// File filter for images
const imageFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
  }
};

// Configure multer for memory storage (we'll upload to cloud storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 10 // Maximum 10 files
  },
  fileFilter: imageFilter
});

// Middleware for single image upload
const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    const singleUpload = upload.single(fieldName);
    
    singleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File size must be less than 5MB'
            }
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'TOO_MANY_FILES',
              message: 'Maximum 10 files allowed'
            }
          });
        }
        
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message
          }
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: err.message
          }
        });
      }
      
      next();
    });
  };
};

// Middleware for multiple image upload
const uploadMultiple = (fieldName, maxCount = 10) => {
  return (req, res, next) => {
    const multipleUpload = upload.array(fieldName, maxCount);
    
    multipleUpload(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'FILE_TOO_LARGE',
              message: 'File size must be less than 5MB'
            }
          });
        }
        
        if (err.code === 'LIMIT_FILE_COUNT') {
          return res.status(400).json({
            success: false,
            error: {
              code: 'TOO_MANY_FILES',
              message: `Maximum ${maxCount} files allowed`
            }
          });
        }
        
        return res.status(400).json({
          success: false,
          error: {
            code: 'UPLOAD_ERROR',
            message: err.message
          }
        });
      } else if (err) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: err.message
          }
        });
      }
      
      next();
    });
  };
};

module.exports = {
  uploadSingle,
  uploadMultiple
};