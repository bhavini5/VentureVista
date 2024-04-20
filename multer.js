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
