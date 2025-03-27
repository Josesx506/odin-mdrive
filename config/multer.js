const path = require('node:path');
const multer = require('multer');
const prismaCntlr = require('../controller/prismaController');

// Set up Multer for handling file uploads in memory buffers without disk storage
const storage = multer.memoryStorage();

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10000000 }, // 10 MB
    fileFilter: function(req, file, cb) {
      checkFileType(file, cb);
    }
});

// Check file type
function checkFileType(file, cb) {
    const filetypes = /jpeg|jpg|png|gif|mp4|mpg|mpeg|avi|mov|mkv/; // Image & video formats
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);

    if (mimetype && extname) {
        return cb(null, true);
    } else {
        cb({ message: 'Error: Only images (jpeg, jpg, png, gif) and videos (mp4, mpg, mpeg, avi, mov, mkv) are allowed!' });
    }
}

function uploadSingleFile (req, res, next) {
    // upldFile is the form input name attribute value
    upload.single("upldFile")(req, res, (err) => {
        // Bad file format pattern
        if (err) {
            console.log(err.message)
            return next(err)
        }
        // No file uploaded
        if (!req.file) {
            return next(new Error("No file uploaded!"));
        }
        // No errors
        next();
    });
};


module.exports = uploadSingleFile;