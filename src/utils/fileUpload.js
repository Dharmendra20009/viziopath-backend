const multer = require('multer');
const path = require('path');
const fs = require('fs');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
if (process.env.CLOUDINARY_CLOUD_NAME) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
}

// Configure local storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter
const fileFilter = (req, file, cb) => {
  // Allow images and documents
  const allowedTypes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'text/plain'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1 // Only allow 1 file at a time
  }
});

// Upload to Cloudinary
const uploadToCloudinary = async (filePath, folder = 'viziopath') => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured');
    }

    const result = await cloudinary.uploader.upload(filePath, {
      folder: folder,
      resource_type: 'auto',
      transformation: [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    });

    // Delete local file after upload
    fs.unlinkSync(filePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      size: result.bytes
    };
  } catch (error) {
    // Clean up local file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
};

// Delete from Cloudinary
const deleteFromCloudinary = async (publicId) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      throw new Error('Cloudinary not configured');
    }

    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    throw error;
  }
};

// Generate thumbnail for images
const generateThumbnail = async (imageUrl, width = 150, height = 150) => {
  try {
    if (!process.env.CLOUDINARY_CLOUD_NAME) {
      return imageUrl; // Return original if Cloudinary not configured
    }

    const thumbnailUrl = cloudinary.url(imageUrl, {
      transformation: [
        { width, height, crop: 'fill' },
        { quality: 'auto:good' }
      ]
    });

    return thumbnailUrl;
  } catch (error) {
    return imageUrl; // Return original on error
  }
};

// Validate file size
const validateFileSize = (file, maxSize = 5 * 1024 * 1024) => {
  if (file.size > maxSize) {
    throw new Error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
  }
  return true;
};

// Validate image dimensions
const validateImageDimensions = async (filePath, minWidth = 100, minHeight = 100) => {
  try {
    const { default: sharp } = await import('sharp');
    const metadata = await sharp(filePath).metadata();
    
    if (metadata.width < minWidth || metadata.height < minHeight) {
      throw new Error(`Image dimensions must be at least ${minWidth}x${minHeight}px`);
    }
    
    return true;
  } catch (error) {
    if (error.message.includes('Image dimensions')) {
      throw error;
    }
    // If sharp is not available, skip dimension validation
    return true;
  }
};

// Clean up old files
const cleanupOldFiles = async (directory = 'uploads/', maxAge = 24 * 60 * 60 * 1000) => {
  try {
    if (!fs.existsSync(directory)) return;

    const files = fs.readdirSync(directory);
    const now = Date.now();

    for (const file of files) {
      const filePath = path.join(directory, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtime.getTime() > maxAge) {
        fs.unlinkSync(filePath);
        console.log(`Cleaned up old file: ${file}`);
      }
    }
  } catch (error) {
    console.error('Error cleaning up old files:', error);
  }
};

// Schedule cleanup (run every hour)
setInterval(() => {
  cleanupOldFiles();
}, 60 * 60 * 1000);

module.exports = {
  upload,
  uploadToCloudinary,
  deleteFromCloudinary,
  generateThumbnail,
  validateFileSize,
  validateImageDimensions,
  cleanupOldFiles
};


