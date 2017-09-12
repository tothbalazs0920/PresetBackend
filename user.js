var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
  email: String,
  oauthID: String,
  name: String,
  picture: String,
  givenName: String,
  familyName: String,
  created: Date,
  language: String, 
  gender: String,
  presetsIds: { type : Array , "default" : [] }
});

let user = mongoose.model('User', userSchema);

module.exports = user;