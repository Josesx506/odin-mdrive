const bcrypt = require("bcryptjs");
const passport = require('passport');
const prisma = require('../config/prismaClient');
const { validationResult } = require('express-validator');

function getRegisterUser(req, res) {
    if(req.isAuthenticated()){
        res.redirect('/');
    } else {
        res.render("auth/signUp", {
            title: "sign up"
        })
    };
}

async function postRegisterUser (req, res, next) {
    const errors = validationResult(req);
  
    if (!errors.isEmpty()) {
      return res.status(400).render("auth/signUp", {
        title: "Sign up",
        errors: errors.array(),
      });
    
    } else {
      
      try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10);
        const user = await prisma.driveUser.create({
            data: {
                name: req.body.username,
                email: req.body.email.toLowerCase(),
                password: hashedPassword,
                files: {
                  create: {
                    name: 'root',
                    type: 'FOLDER',
                  }
                }
            }
        });
        
        // Redirect the user to login after registration
        res.status(200).redirect("/auth/signin");
      
      } catch(err) {
        return next(err);
      }
    }
};

function getSignUserIn(req, res) {
    if(req.isAuthenticated()){
        res.redirect('/drive/view');
    } else {
        res.render("auth/signIn", {
        title: "Sign In"
    })};
}

async function postSignUserIn (req, res, next) {

    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).render("auth/signIn", {
        title: "sign in",
        errors: errors.array(),
      });
    
    } else {
      passport.authenticate("local", (err, user, info) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.render("auth/signIn", { 
            title: "Sign In",
            errors: [ {msg: info.message} ]
        })};
        
        // Successful login
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.redirect('/drive/view');
        });
      })(req, res, next);
    }
}

function getSignUserOut(req, res, next) {
    req.logout((err) => {
      if (err) {
        return next(err);
      }
      res.redirect("/");
    });
}


module.exports = { 
    getRegisterUser, postRegisterUser,
    getSignUserIn, postSignUserIn,
    getSignUserOut
 }