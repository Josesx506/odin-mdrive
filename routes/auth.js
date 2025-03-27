const router = require('express').Router();
const validate = require('../config/validator');
const authCntlr = require('../controller/authController');

// Middleware to add the baseUrl to response.locals
router.use((req,res,next)=>{
  res.locals.baseUrl = req.baseUrl;
  next();
})

// Routes
router.get("/register", authCntlr.getRegisterUser);
router.post("/register", validate.validateSignUp, authCntlr.postRegisterUser);
router.get("/signin", authCntlr.getSignUserIn);
router.post("/signin", validate.validateSignIn, authCntlr.postSignUserIn);
router.get("/signout", authCntlr.getSignUserOut);

module.exports = router;