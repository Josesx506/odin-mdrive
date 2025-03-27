const { body, validationResult } = require("express-validator");
const prisma = require('./prismaClient');

const validateSignUp = [
    body("username")
      .trim()
      .matches(/^[a-zA-Z0-9\s]+$/).withMessage(`Username must contain only letters and numbers`)
      .isLength({ min: 5, max: 10 }).withMessage(`Username must be between 5 and 10 characters`)
      .escape(),
    body("email")
        .trim()
        .normalizeEmail()
        .isEmail().withMessage(`Invalid email value`)
        .custom(async (value) => {
          const prvUser = await prisma.driveUser.findUnique({
            where: {
              email: value.toLowerCase()
            }
          })
          if (prvUser) {
            throw new Error('This email is unavailable, try signing up with a different email');
          }
          return true;
        }),
    body("password")
      .trim()
      .escape()
      .isLength({ min: 5, max: 9 }).withMessage('Password must be between 5-9 characters long.')
      .matches(/^(?=.*[A-Z])(?=.*\d)(?=.*[^\w<>]).{5,9}$/)
      .withMessage('Password must include at least one uppercase letter, one number, and one special character (excluding < or >).'),
    body("confirmPassword")
      .trim()
      .escape()
      .custom((value, {req})=>{
        if (value != req.body.password) {
          throw new Error('Password mismatch!');
        }
        return true;
      })
];

const validateSignIn = [
  body("email")
    .trim()
    .normalizeEmail()
    .isEmail(),
  body("password")
    .trim()
    .notEmpty().withMessage("Password cannot be empty.")
]

module.exports = { validateSignUp, validateSignIn }