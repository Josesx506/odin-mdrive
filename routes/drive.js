const router = require('express').Router();
const validate = require('../config/validator');
const multerMdlwr = require('../config/multer');
const driveCntlr = require('../controller/uploadController');

// Middleware to add the baseUrl to response.locals
router.use((req,res,next)=>{
  res.locals.baseUrl = req.baseUrl;
  next();
})
router.use(driveCntlr.protectRoutes);


router.get("/view/:itemId?", driveCntlr.getDriveView);
router.post("/create", driveCntlr.postFolder);
router.post("/upload", multerMdlwr, driveCntlr.postFile);
router.post("/delete/:itemId?", driveCntlr.deletebyId);
router.post("/share", driveCntlr.shareById);

module.exports = router;