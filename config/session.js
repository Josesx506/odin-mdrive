const prisma = require('./prismaClient');
const expressSession = require('express-session');
const { PrismaSessionStore } = require('@quixo3/prisma-session-store');
require('dotenv').config();

const prismaSessStore = new PrismaSessionStore(
    prisma,
    {
      checkPeriod: 2 * 60 * 1000,  //ms
      dbRecordIdIsSessionId: true,
      dbRecordIdFunction: undefined,
      sessionModelName: 'driveSession'
    }
);

const sessionMdlware = expressSession({
    cookie: {maxAge: 24 * 60 * 60 * 1000}, // 24h in ms 
    secret: process.env.SESS_SECRET,
    resave: true,
    saveUninitialized: true,
    store: prismaSessStore,
});


module.exports = sessionMdlware