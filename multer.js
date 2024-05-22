// const multer = require("multer");
// const path = require("path");
// const fs = require("fs");

// // Allowed file types for validation
// const fileTypes = /jpeg|jpg|png|gif/;

// // Function to check file type
// function checkFileType(file, cb) {
//   const extName = fileTypes.test(path.extname(file.originalname).toLowerCase());
//   const mimeType = fileTypes.test(file.mimetype);

//   if (mimeType && extName) {
//     return cb(null, true);
//   } else {
//     cb("Error: Images Only!");
//   }
// }

// // In-memory storage configuration
// const memoryStorage = multer.memoryStorage();

// // Disk storage configuration
// const diskStorage = multer.diskStorage({
//   destination: function (req, file, cb) {
//     const uploadDir = './uploads';
//     // Ensure the uploads directory exists
//     fs.mkdirSync(uploadDir, { recursive: true });
//     cb(null, uploadDir); // Specify the destination folder
//   },
//   filename: function (req, file, cb) {
//     // Use original file name with a timestamp to avoid naming conflicts
//     cb(null, Date.now() + '-' + file.originalname);
//   }
// });

// // Listing image upload configuration (multiple files)
// const uploadListingImages = multer({
//   storage: memoryStorage,
//   limits: { fileSize: 1000000 }, // 1MB file size limit
//   fileFilter: function (req, file, cb) {
//     checkFileType(file, cb);
//   }
// }).array("listing[image]", 12);

// // Review image upload configuration (single file)
// const uploadReviewImage = multer({
//   storage: diskStorage,
//   limits: { fileSize: 1000000 }, // 1MB file size limit
//   fileFilter: function (req, file, cb) {
//     checkFileType(file, cb);
//   }
// }).single("review[image]");

// module.exports = {
//   uploadListingImages,
//   uploadReviewImage
// };






const multer = require('multer');

// Define storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './uploads'); // Specify the destination folder
  },
  filename: function (req, file, cb) {
    // Use original file name with a timestamp to avoid naming conflicts
    cb(null, Date.now() + '-' + file.originalname);
  }
});

// Configure multer with the storage options
const upload = multer({ storage: storage }); // Move the 'array' method outside of the options object

module.exports = upload; // Export the upload configuration for reuse