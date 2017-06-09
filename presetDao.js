const mongoose = require('mongoose');
var mongoosastic = require("mongoosastic");
mongoose.connect(process.env.MONGO_URL);
var conn = mongoose.connection;
mongoose.Promise = global.Promise;

const fs = require('fs');
const multer = require('multer');
var GridFsStorage = require('multer-gridfs-storage');
var Grid = require('gridfs-stream');
Grid.mongo = mongoose.mongo;
var gfs = Grid(conn.db);

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
    return Preset.findOne({ '_id': id }).remove().exec();
}

module.exports.findUser = function (email) {
    var query = User.findOne({ email: email });
    return query.exec();
}

module.exports.saveUser = function (oauthID, email, name, picture) {
    user = new User({
        oauthID: oauthID,
        email: email,
        name: name,
        picture: picture,
        created: Date.now()
    });
    return user.save();
}

module.exports.searchPresets = function (terms) {
    return Preset.search({ query_string: { query: terms } }, { hydrate: false });
}

module.exports.gridFsEndpoints = function (app) {

    // Setting up storage using multer-gridfs-storage
    var storage = GridFsStorage({
        gfs: gfs,
        filename: function (req, file, cb) {
            var datetimestamp = Date.now();
            cb(null, new ObjectID() + '.' + file.originalname.split('.')[file.originalname.split('.').length - 1]);
        },
        // With gridfs we can store aditional meta-data along with the file 
        metadata: function (req, file, cb) {
            cb(null, { originalname: file.originalname });
        },
        root: 'audio' //root name for collection to store files into
    });

    var upload = multer({ //multer settings
        storage: storage
    }).single('file');

    // API path that will upload the files 
    app.post('/api/upload', function (req, res) {
        upload(req, res, function (err) {
            if (err) {
                console.log(err);
                res.json({ error_code: 1, err_desc: err });
                return;
            }
            res.json({
                error_code: 0,
                err_desc: null,
                filename: req.file.filename,
                originalname: req.file.originalname
            });
        });
    });

    app.get('/api/audio/:filename', function (req, res) {
        gfs.collection('audio'); //set collection name to lookup into

        // First check if file exists
        gfs.files.find({ filename: req.params.filename }).toArray(function (err, files) {
            if (!files || files.length === 0) {
                return res.status(404).json({
                    responseCode: 1,
                    responseMessage: "error"
                });
            }
            // create read stream 
            var readstream = gfs.createReadStream({
                filename: files[0].filename,
                root: "audio"
            });
            // set the proper content type
            res.set('Content-Type', files[0].contentType)
            return readstream.pipe(res);
        });
    });

    //binary presets
    // Setting up storage using multer-gridfs-storage
    var presetStorage = GridFsStorage({
        gfs: gfs,
        filename: function (req, presetFile, cb) {
            var datetimestamp = Date.now();
            cb(null, new ObjectID() + '.' + presetFile.originalname.split('.')[presetFile.originalname.split('.').length - 1]);
        },
        // With gridfs we can store aditional meta-data along with the file
        metadata: function (req, presetFile, cb) {
            cb(null, { originalname: presetFile.originalname });
        },
        root: 'presetFile' //root name for collection to store files into
    });

    var presetUpload = multer({ //multer settings
        storage: presetStorage
    }).single('presetFile');

    // API path that will upload the files
    app.post('/api/presetfile/upload', function (req, res) {
        presetUpload(req, res, function (err) {
            if (err) {
                console.log(err);
                res.json({ error_code: 1, err_desc: err });
                return;
            }
            res.json({
                error_code: 0,
                err_desc: null,
                filename: req.file.filename,
                originalname: req.file.originalname
            });
        });
    });

    app.get('/api/presetfile/:filename', function (req, res) {
        gfs.collection('presetFile'); //set collection name to lookup into

        // First check if file exists 
        gfs.files.find({ filename: req.params.filename }).toArray(function (err, files) {
            if (!files || files.length === 0) {
                return res.status(404).json({
                    responseCode: 1,
                    responseMessage: "error"
                });
            }

            var readstream = gfs.createReadStream({
                filename: files[0].filename,
                root: "presetFile"
            });

            res.set('Content-Type', files[0].contentType)

            return readstream.pipe(res);
        });
    });

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
            page = params.page - 1;
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
