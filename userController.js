var presetDao = require('./presetDao');

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

module.exports.saveUser = function (oauthID, email, name, picture) {
    return presetDao.saveUser(oauthID, email, name, picture)
        .then(
        result => {
            return result;
        }
        ).catch(
        err => console.log(err)
        );
}
