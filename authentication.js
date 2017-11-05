var GoogleStrategy = require('passport-google-oauth2').Strategy;
const passport = require('passport');
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = process.env.JWTOPTIONS_SECRET;
const Amplitude = require('amplitude');
let amplitude = new Amplitude(process.env.amplitudeApiKey);
let User = require('./user');

var userController = require("./userController");

passport.serializeUser(function serialize(user, done) {
    done(null, user);
});

passport.deserializeUser(function deserialize(obj, done) {
    done(null, obj);
});

passport.use('google', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.API_ROOT + '/auth/google/callback'
},
    function (request, accessToken, refreshToken, profile, done) {
        return userController.getUser(profile.email)
            .then(function (user) {
                if (user !== null) {
                    let data = {
                        eventType: 'login',
                        userId: user.email,
                    };
                    amplitude.track(data);
                    done(null, user);
                    return;
                } else {
                    done(null, null);
                }
            });
    }));

passport.use('google-signup', new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: process.env.API_ROOT + '/signup/google/callback'
},
    function (request, accessToken, refreshToken, profile, done) {  
        return userController.getUser(profile.email)
            .then(function (user) {
                if (user !== null) {
                    let data = {
                        eventType: 'login',
                        userId: user.email,
                    };
                    amplitude.track(data);
                    done(null, user);
                    return;
                } else {
                    let user = new User({
                        oauthID: profile.id,
                        email: profile.email,
                        name: profile.displayName,
                        picture: profile.photos[0].value,
                        givenName: profile.name.givenName,
                        familyName: profile.name.familyName,
                        language: profile.language,
                        gender: profile.gender,
                        created: Date.now()
                    });
                    let data = {
                        eventType: 'signup',
                        userId: user.email,
                    };
                    amplitude.track(data);
                    return userController.saveUser(user);
                }
            }).then(function (result) {
                if (result) {
                    console.log("saving user ...");
                    done(null, result);
                }
            });
    }));

let strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    userController.getUser(jwt_payload.email)
        .then((user) => {
            if (user) {
                next(null, user);
            } else {
                console.log('Email not found');
                next(null, false);
            }
        });
});
passport.use(strategy);

module.exports.getPassport = function () {
    return passport;
}
