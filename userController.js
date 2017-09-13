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

module.exports.saveUser = function (user) {
    return presetDao.saveUser(user)
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

module.exports.updateDownloadedPresets = function (presetId, email) {
    presetDao.findUser(email)
        .then((user) => {
            user.updateDownloadedPresets.push(presetId);
            return presetDao.saveUser(user);
        }).then(result => {
            return result;
        }
        ).catch(
        err => console.log(err)
        );
}
