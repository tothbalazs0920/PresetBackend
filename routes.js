var presetController = require("./presetController");
var userController = require("./userController");

const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = process.env.JWTOPTIONS_SECRET;
var authentication = require('./authentication');
var passport = authentication.getPassport();
const awsService = require('./awsService');
const stripe = require("stripe")(process.env.STRIPE_API_KEY);

module.exports = function (app) {
    app.use(passport.initialize());

    app.get('/api/health-check', (req, res) => {
        return res.json('Ok');
    });

    app.get('/api/presetList', function (req, res) {
        var perPage = 6;
        var page = req.query.page > 0 ? req.query.page : 0;
        presetController.getPresetList(page, perPage, function (results) { res.json(results); });
    });

    app.get('/api/preset/profile', passport.authenticate('jwt', { session: false }), (req, res) => {
        presetController.getPresetsByEmail(req.user.email)
            .then(
            result => {
                return res.json(result);
            }).catch(error => console.log(error));
    });

    app.get('/api/preset/:id', (req, res) => {
        presetController.getPresetsById(req.params.id)
            .then(
            result => {
                return res.json(result);
            });
    });

    app.put('/api/preset', passport.authenticate('jwt', { session: false }), (req, res) => {
        presetController.updatePreset(
            req.body._id, req.body.name, req.body.description, req.body.technology, req.user.email, req.user.name, req.user.picture,
            req.body.audioFileId, req.body.originalAudoFileName, req.body.presetId, req.body.originalPerestFileName,
            req.body.amp, req.body.cabinet, req.body.author, req.body.album, req.body.songTitle, req.body.imageFileId, req.body.originalImageFileName,
            req.body.youtubeUrl, req.body.ampChannel, req.body.pickupType, req.body.michrophonePosition, req.body.michrophone,
            req.body.price, req.body.currency)
            .then(
            result => {
                return res.json(result);
            });
    });

    app.delete('/api/preset/:id', passport.authenticate('jwt', { session: false }), (req, res) => {
        presetController.deletePreset(req.params.id)
            .then(
            result => {
                return res.json(result);
            });
    });

    app.get('/api/user/:email', function (req, res) {
        userController.getUser(req.params.email)
            .then(
            result => {
                return res.json(result);
            });
    });

    app.post('/api/user/:email', function (req, res) {
        userController.saveUser('1234', req.params.email, 'profile.displayName')
            .then((result) => {
                return res.json(result);
            });
    });

    app.get('/signup/google', passport.authenticate('google-signup', {
        failureRedirect: process.env.FRONTEND_URL + '/error',
        scope: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/plus.profile.emails.read'
        ]
    }), function (req, res) {
        res.redirect(process.env.FRONTEND_URL + '/presets?token=' + '');
    });

    app.get('/auth/google', passport.authenticate('google', {
        failureRedirect: process.env.FRONTEND_URL + '/error',
        scope: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/plus.profile.emails.read'
        ]
    }), function (req, res) {
        res.redirect(process.env.FRONTEND_URL + '/presets?token=' + '');
    });

    // handle google callback
    app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: process.env.FRONTEND_URL + '/login',
    }),
        function (req, res) {
            if(!req.user) {
                res.redirect(process.env.FRONTEND_URL + '/login');
                return;
            }
            let payload = { email: req.user.email };
            let token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1h' });
            res.redirect(process.env.FRONTEND_URL + '/presets?pageNumber=1&searchTerm=&previouslySearchedTerm=&token=' + token);
        });

    app.get('/signup/google/callback', passport.authenticate('google-signup', {
        failureRedirect: process.env.FRONTEND_URL + '/error',
    }),
        function (req, res) {
            let payload = { email: req.user.email };
            let token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1h' });
            res.redirect(process.env.FRONTEND_URL + '/presets?pageNumber=1&searchTerm=&previouslySearchedTerm=&token=' + token);
        });

    app.get('/api/sign-s3', (req, res) => {
        const fileName = req.query['file-name'];
        const fileType = req.query['file-type'];
        const mp3 = req.query['mp3'];
        const operation = req.query['operation'];
        /*
        if (fileType !== 'audio/mp3') {
            res.status(400).send('file-type must be mp3');
            res.end();
        }
        */
        awsService.getPresignedUrl(fileName, fileType, mp3, operation)
            .then((signedRequest) => {
                res.write(JSON.stringify({ signedRequest: signedRequest }));
                res.end();
            });
    });

    app.put('/api/user/downloads', passport.authenticate('jwt', { session: false }), (req, res) => {
        userController.updateDownloadedPresets(
            req.body.presetId, req.body.email)
            .then(
            result => {
                return res.json(result);
            });
    });

    app.get('/api/mydownloads', passport.authenticate('jwt', { session: false }), (req, res) => {
        userController.getDownloadedPresets(req.user.email)
            .then(
            result => {
                return res.json(result);
            });
    });

    app.post('/api/stripepayment', passport.authenticate('jwt', { session: false }), async (req, res) => {
        let token = req.body.tokenId;
        let presetId = req.body.presetId;
        let amount = req.body.amount;
        let currency = req.body.currency;
        let presetUploaderEmail = req.body.presetUploaderEmail;
        let result;
        try {
            let user = await userController.getUser(presetUploaderEmail);
            let charge = await stripe.charges.create({
                amount: amount,
                currency: currency,
                description: "Charge for " + presetId,
                receipt_email: req.user.email,
                source: token,
                application_fee: amount / 10
            }, {
                    stripe_account: user.stripeUserId
                });
            result = await userController.updateDownloadedPresets(req.body.presetId, req.user.email);
        } catch (error) {
            console.log(error);
            res.status(500);
            return res.json(error);
        }
        return res.json(result);
    });

    app.get('/api/stripe', passport.authenticate('jwt', { session: false }), (req, res) => {
        userController.getUser(req.user.email)
            .then((user) => {
                if (user.stripeUserId) {
                    return res.json(true);
                }
                return res.json(false);
            });
    });

    app.post('/api/stripe', passport.authenticate('jwt', { session: false }), (req, res) => {
        console.log('post api/stripe ', req.user.email, req.body.stripeCode);
        userController.saveStripeUserId(req.user.email, req.body.stripeCode)
            .then((result) => {
                return res.json(result);
            });
    });

}
