var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var presetSchema = new Schema({
  email: String,
  use_id: Number,
  name: String,
  picture: String,
  given_name: String,
  family_name: String,
  nickname: String,
  presetsIds: { type : Array , "default" : [] },
});

var Preset = mongoose.model('User', presetSchema);

module.exports = Preset;