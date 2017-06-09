var presetDao = require('./presetDao');
var Preset = require('./preset');
var mongoose = require('mongoose');

module.exports.getAllPresets = function (callback) {
    presetDao.findAll(callback);
}

module.exports.getPresetList = function (page, perPage, callback) {
    presetDao.findPresetList(page, perPage, callback);
}

module.exports.getPresetsById = function (id) {
    return presetDao.findPresetsById(id)
        .then(
        preset => {
            return preset;
        }
        ).catch(
        err => console.log(err)
        );
}

module.exports.getPresetsByEmail = function (email) {
    return presetDao.findPresetsByEmail(email)
        .then(
        presets => {
            return presets;
        }).catch(
        err => console.log(err)
        );
}

var populatePreset = function (
    preset, id, name, description, technology, email, presetAuthor, profilePicture,
     audioFileId, originalAudoFileName, presetId, originalPerestFileName,
     amp, cabinet, author, album, songTitle) {
    preset.name = name;
    preset.description = description;
    preset.technology = technology;
    preset.email = email;
    preset.presetAuthor = presetAuthor;
    preset.profilePicture = profilePicture;
    preset.audioFileId = audioFileId;
    preset.originalAudoFileName = originalAudoFileName;
    preset._id = mongoose.Types.ObjectId(id);
    preset.presetId = presetId;
    preset.originalPerestFileName = originalPerestFileName;
    preset.amp = amp;
    preset.cabinet = cabinet;
    preset.author = author;
    preset.album = album;
    preset.songTitle = songTitle;
    return preset;
}

module.exports.updatePreset = function (id, name, description, technology, email, presetAuthor, profilePicture,
 audioFileId, originalAudioFileName, presetId, originalPresetFileName,
 amp, cabinet, author, album, songTitle) {
    var presetInstance = new Preset();
    return presetDao.findPresetsById(id)
        .then(
        result => {
            if (result) {
                presetInstance = result;
            }
            presetInstance = populatePreset(presetInstance, id, name, description, technology, email, presetAuthor, profilePicture,
             audioFileId, originalAudioFileName, presetId, originalPresetFileName,
             amp, cabinet, author, album, songTitle);
            return presetDao.savePreset(presetInstance);
        }).then(
        result => {
            return result;
        }).catch(
        err => console.log(err)
        );
}

module.exports.deletePreset = function (id) {
    return presetDao.deletePreset(id)
        .then(
        result => {
            return result;
        }
        ).catch(
        err => console.log(err)
        );
}

/*
module.exports.searchPresets = function (terms) {
    return presetDao.searchPresets(terms)
        .then(
        presets => {
            return presets;
        }).catch(
        err => console.log(err)
        );
}
*/