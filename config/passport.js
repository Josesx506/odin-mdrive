const bcrypt = require("bcryptjs");
const passport = require('passport');
const prisma = require('./prismaClient');
const LocalStrategy = require("passport-local").Strategy;

const customFields = {
  usernameField: 'email',
  passwordField: 'password'
}

// Local Strategy for authentication
async function verifyLocalCallback(email, password, done) {
  try {
    const user = await prisma.driveUser.findUnique({
        where: { email: email.toLowerCase() }
    })

    if (!user) {
      return done(null, false, { message: "Incorrect email/password" });
    }
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return done(null, false, { message: "Incorrect password" });
    }

    return done(null, user);

  } catch(err) {
    return done(err);
  }
}
const localStrategy = new LocalStrategy(customFields, verifyLocalCallback);

// Serializers for local strategy signin and signout
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await prisma.driveUser.findUnique({
        where: { id: id }
    });
    done(null, user);
  } catch(err) {
    done(err);
  }
});

passport.use(localStrategy);

module.exports = { passport,localStrategy };