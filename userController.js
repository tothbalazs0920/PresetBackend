var presetDao = require('./presetDao');
const Amplitude = require('amplitude');
let amplitude = new Amplitude(process.env.amplitudeApiKey);

module.exports.getUser = function (email) {
    return presetDao.findUser(email)
        .then(
        user => {
            return user;
        }
        ).catch(
        err => console.log(err)
        );
}

module.exports.saveUser = function (oauthID, email, name, picture, familyName, givenName, language, gender) {
    return presetDao.saveUser(oauthID, email, name, picture, familyName, givenName, language, gender)
        .then(
        result => {
            let data = {
                eventType: 'signup',
                userId: email,
            };
            amplitude.track(data);
            return result;
        }
        ).catch(
        err => console.log(err)
        );
}
