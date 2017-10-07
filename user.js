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
  created: Date,
  presetsIds: { type : Array , "default" : [] },
  downLoadedPresetsIds: { type : Array , "default" : [] },
  stripeUserId: String
});

let user = mongoose.model('User', userSchema);

module.exports = user;