var presetDao = require('./presetDao');
const Amplitude = require('amplitude');
let amplitude = new Amplitude(process.env.amplitudeApiKey);
let request = require('request-promise');

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
    return presetDao.findUser(email)
        .then((user) => {
            if (!user.downLoadedPresetsIds.includes(presetId)) {
                user.downLoadedPresetsIds.push(presetId);
                console.log("updated user: ", user);
            }
            return presetDao.saveUser(user);
        }).then((result) => {
            return result;
        }).catch(
        (err) => console.log(err)
        );
}

module.exports.getDownloadedPresets = function (email) {
    return presetDao.findUser(email)
        .then((user) => {
            return presetDao.findDownloadedPresets(user.downLoadedPresetsIds);
        }).then(result => {
            return result;
        }
        ).catch(
        err => console.log(err)
        );
}

module.exports.saveStripeUserId = function (email, stripeCode) {
    console.log('stripeCode: ', stripeCode);
    let stripeUserId;

    return request.post({
        url: 'https://connect.stripe.com/oauth/token',
        form: {
            grant_type: "authorization_code",
            client_id: process.env.STRIPE_CLIENT_ID,
            code: stripeCode,
            client_secret: process.env.STRIPE_API_KEY
        }
    }).then((result) => {
        console.log('rerponse from oauth/token', result);
        stripeUserId = JSON.parse(result).stripe_user_id;
        return presetDao.findUser(email);
    }).then((user) => {
        console.log('found user');
        console.log('stripeUserId', stripeUserId);
        user.stripeUserId = stripeUserId;
        return presetDao.saveUser(user);
    }).then((user) => {
        console.log('saved user');
        return user;
    }).catch(
        err => console.log(err)
        );
}
