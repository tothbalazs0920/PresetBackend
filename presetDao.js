const mongoose = require('mongoose');
var mongoosastic = require("mongoosastic");
mongoose.connect(process.env.MONGODB_URI);
var conn = mongoose.connection;
mongoose.Promise = global.Promise;

var Preset = require('./preset');
var User = require('./user');
var ObjectID = require('mongodb').ObjectID;

module.exports.findAll = function (callback) {
    Preset.find({}, function (err, result) {
        if (err) throw err;
        callback(result);
    });
}

module.exports.findPresetList = function (page, perPage, callback) {
    Preset
        .find()
        .limit(perPage)
        .skip(perPage * (page - 1))
        .sort({ name: 'asc' })
        .exec(function (err, presets) {
            Preset.count().exec(function (err, count) {
                if (err) throw err;
                callback({
                    presets: presets,
                    total: count
                });
            })
        });
}

module.exports.findDownloadedPresets = function (downLoadedPresetsIds) {
    return Preset
        .find({_id: { $in : downLoadedPresetsIds }})
        .exec();
}

module.exports.findPresetsById = function (id) {
    return Preset.findOne({ '_id': id }).exec();
}

module.exports.findPresetsByEmail = function (email) {
    return Preset.find({ 'email': email }).exec();
}

module.exports.savePreset = function (presetInstance) {
    return presetInstance.save();
}

module.exports.deletePreset = function (id) {
    return Preset.findOne({ '_id': id }).exec()
        .then((preset) => {
            return preset.remove();
        });
}

module.exports.findUser = function (email) {
    var query = User.findOne({ email: email });
    return query.exec();
}

module.exports.saveUser = function (user) {
    return user.save();
}

module.exports.searchPresets = function (terms) {
    return Preset.search({ query_string: { query: terms } }, { hydrate: false });
}

module.exports.gridFsEndpoints = function (app) {

    app.get("/api/search", function (req, res) {
        let esQuery = buildEsQuery(req.query);

        Preset.esSearch(esQuery, function (err, results) {
            if (err) {
                console.log(err);
            }
            return res.json(results);
        });
    });

    let buildEsQuery = function (params) {
        let esQuery = {};
        let perPage = 3;
        let page;

        if (params.page > 0) {
            page = (params.page - 1) * perPage;
        } else {
            page = 0;
        }

        esQuery.from = page;
        esQuery.size = perPage;
        esQuery.query = {
            match_all: {}
        };

        if (params.q || params.technology) {
            esQuery.query = {
                bool: {
                }
            }
        }

        if (params.q) {
            esQuery.query.bool.must = {
                query_string: {
                    query: params.q
                }
            }
        }

        if (params.technology) {
            esQuery.query.bool.filter = {
                term: {
                    technology: params.technology.toLowerCase()
                }
            }
        }

        return esQuery;
    }

}
