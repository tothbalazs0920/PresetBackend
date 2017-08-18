var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  email: String,
  oauthID: String,
  name: String,
  picture: String,
  given_name: String,
  family_name: String,
  nickname: String,
  created: Date,
  presetsIds: { type : Array , "default" : [] },
});

let user = mongoose.model('User', userSchema);

module.exports = user;