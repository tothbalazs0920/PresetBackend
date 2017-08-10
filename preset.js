var mongoose = require('mongoose');
var mongoosastic = require("mongoosastic");
var Schema = mongoose.Schema;
let URL = require('url');

var presetSchema = new Schema({
  _id: mongoose.Schema.Types.ObjectId,
  name: { type: String, es_indexed: true },
  technology: { type: String, es_indexed: true },
  description: { type: String, es_indexed: true },
  genre: { type: Array, "default": [] },
  numberOfDownLoads: Number,
  amp: { type: String, es_indexed: true },
  cabinet: { type: String, es_indexed: true },
  michrophones: { type: Array, "default": [] },
  presetAuthor: { type: String, es_indexed: true },
  lead: Boolean,
  clean: Boolean,
  rythm: Boolean,
  author: { type: String, es_indexed: true },
  album: { type: String, es_indexed: true },
  songTitle: { type: String, es_indexed: true },
  presetId: { type: String, es_indexed: true },
  originalPerestFileName: { type: String, es_indexed: true },
  img: String,
  profilePicture: { type: String, es_indexed: true },
  price: Number,
  currency: String,
  audioFileId: { type: String, es_indexed: true },
  originalAudoFileName: { type: String, es_indexed: true },
  imageFileId: { type: String, es_indexed: true },
  originalImageFileName: { type: String, es_indexed: true },
  email: { type: String, es_indexed: true },
});

  var url = URL.parse(process.env.BONSAI_URL);
  console.log('url.host:', url.host);
  presetSchema.plugin(mongoosastic, {
    host: url.host,
    auth: url.auth
  });

var Preset = mongoose.model('Presets', presetSchema);

Preset.createMapping(function (err, mapping) {
  if (err) {
    console.log('error creating mapping (you can safely ignore this)');
    console.log(err);
  } else {
    console.log('mapping created!');
    console.log(mapping);
  }
});

module.exports = Preset;
