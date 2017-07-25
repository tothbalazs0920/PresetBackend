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
const aws = require('aws-sdk');

aws.config.update({
    accessKeyId: process.env.AWSAccessKeyId,
    secretAccessKey: process.env.AWSSecretKey,
    region: "eu-west-1"
});

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
            req.body.amp, req.body.cabinet, req.body.author, req.body.album, req.body.songTitle)
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
            .then(
            result => {
                return res.json(result);
            });
    });

    app.get('/auth/google', passport.authenticate('google', {
        failureRedirect: process.env.FRONTEND_URL,
        scope: [
            'https://www.googleapis.com/auth/plus.login',
            'https://www.googleapis.com/auth/plus.profile.emails.read'
        ]
    }), function (req, res) {
        res.redirect(process.env.FRONTEND_URL + '/presets?token=' + '');
    });

    // handle google callback
    app.get('/auth/google/callback', passport.authenticate('google', {
        failureRedirect: process.env.FRONTEND_URL
    }),
        function (req, res) {
            var payload = { email: req.user.email };
            var token = jwt.sign(payload, jwtOptions.secretOrKey, { expiresIn: '1h' });
            res.redirect(process.env.FRONTEND_URL + '/presets?pageNumber=1&searchTerm=&previouslySearchedTerm=&token=' + token);
        });

    app.get('/api/sign-s3', (req, res) => {
        const s3 = new aws.S3();
        const fileName = req.query['file-name'];
        const fileType = req.query['file-type'];
        const mp3 = req.query['mp3'];
        /*
        if (fileType !== 'audio/mp3') {
            res.status(400).send('file-type must be mp3');
            res.end();
        }
        */
        const bucket = getBucketName(mp3);
        console.log('bucket', bucket);
        const s3Params = {
            Bucket: bucket,
            Key: fileName,
            Expires: 600,
            ContentType: fileType,
            ACL: 'public-read'
        };

        s3.getSignedUrl('putObject', s3Params, (err, data) => {
            if (err) {
                console.log(err);
                return res.end();
            }
            const returnData = {
                signedRequest: data,
                url: `https://${process.env.S3_BUCKET_MP3}.s3.amazonaws.com/${fileName}`
            };
            res.write(JSON.stringify(returnData));
            res.end();
        });
    });

    const getBucketName = function (mp3) {
        if (mp3 === 'true') {
            return process.env.S3_BUCKET_MP3;
        }
        return process.env.S3_BUCKET_PRESET;
    };

}
/*
app.post('/api/user', (req, res) => {
  User.findOne({ 'email': req.body.email }, function (err, found) {
    if (err) {
      throw err;
    }
    if (found) {
      res.status(204).send();
      return;
    } else {
      var userInstance = new User();
      userInstance.email = req.body.email;
      userInstance.user_id = req.body.user_id;
      userInstance.name = req.body.name;
      userInstance.picture = req.body.picture;
      userInstance.given_name = req.body.given_name;
      userInstance.family_name = req.body.family_name;
      userInstance.nickname = req.body.nickname;

      userInstance.save(function (err) {
        if (err) {
          res.status(500).send();
        }
        res.status(204).send();
      });
    }
  });
});
*/

