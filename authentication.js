var GoogleStrategy = require('passport-google-oauth2').Strategy;
const passport = require('passport');
const jwt = require('jsonwebtoken');
const passportJWT = require("passport-jwt");
var ExtractJwt = passportJWT.ExtractJwt;
var JwtStrategy = passportJWT.Strategy;
var jwtOptions = {};
jwtOptions.jwtFromRequest = ExtractJwt.fromAuthHeader();
jwtOptions.secretOrKey = process.env.JWTOPTIONS_SECRET;

var userController = require("./userController");

passport.serializeUser(function serialize(user, done) {
    done(null, user);
});

passport.deserializeUser(function deserialize(obj, done) {
    done(null, obj);
});

passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: 'http://localhost:3001/auth/google/callback'
},
    function (request, accessToken, refreshToken, profile, done) {
        return userController.getUser(profile.email)
            .then(function (user) {
                if (user !== null) {
                    done(null, user);
                    return;
                } else {
                    return userController.saveUser(profile.id, profile.email, profile.displayName, profile.photos[0].value);
                }
            })
            .then(function (result) {
                if (result) {
                    console.log("saving user ...");
                    done(null, result);
                }
            });
    }));

var strategy = new JwtStrategy(jwtOptions, function (jwt_payload, next) {
    userController.getUser(jwt_payload.email)
        .then(
        user => {
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