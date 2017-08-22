'use strict';

const express = require('express');
const app = express();
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/', express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(function (req, res, next) {
  res.setHeader("Access-Control-Allow-Origin", process.env.FRONTEND_URL );
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Methods", "GET,HEAD,OPTIONS,POST,PUT,DELETE");
  res.setHeader("Access-Control-Allow-Headers", "Access-Control-Allow-Headers, Origin, Accept, Authorization, X-Requested-With, Content-Type, Access-Control-Request-Method, Access-Control-Request-Headers");
  next();
});

const routes = require("./routes");
routes(app);
const presetDao = require("./presetDao");
presetDao.gridFsEndpoints(app);

app.listen(process.env.PORT  || 3001);
console.log('Listening on port:', process.env.PORT);
console.log(process.env.NODE_ENV);
