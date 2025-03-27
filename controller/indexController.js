const prismaCntlr = require('./prismaController');

async function getHome(req,res) {
    res.render("index",{
        title: "Odin Drive"
    })
}

async function getPublicLink(req,res,next) {
    const dwnId = req.params.downloadId || null;
    if (!dwnId) {
        return next(new Error('Missing shared file id'));
    }
    
    const linkRow = await prismaCntlr.getExpiryUrl(dwnId);

    if (!linkRow || linkRow.expiresAt < Math.floor(Date.now() / 1000)) {
        return next(new Error('This shared link has expired or is invalid'));
    }

    res.redirect(linkRow.privateUrl);
}

function catchAll(req, res, next) {
    const err = new Error("Page not found");
    err.status = 404;
    next(err);
}

function errorHandler(err, req, res, next) {
    res.status(err.status || 500).render('404', {
        title: 'error page',
        id : err.status || 500, 
        error: err.message 
    });
}

module.exports = { getHome, getPublicLink, catchAll, errorHandler }