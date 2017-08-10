'use strict';

const createError = require('http-errors');
const debug = require('debug')('cfgram:basic-auth-middleware');

module.exports = function (req, res, next) {
  debug('basic auth');

  var authHeader = req.headers.authorization; //header: {Authorzation: Basic sf89f89a8Ffs8fSF898}
  if (!authHeader) {
    return next(createError(401, 'authorization header required'));
  }
  //afasdfafwfsfsd9f889:fasdf7as8d7f89s
  var base64str = authHeader.split('Basic')[1];
  if (!base64str) {
    return next(createError(401, 'username and password required'));
  }
  // myusername:mypassword
  var utf8str = new Buffer(base64str, 'base64').toString();
  var authArr = utf8str.split(':');
  //username:myusername, password:mypasword
  req.auth = {
    username: authArr[0],
    password: authArr[1]
  }
  if (!req.auth.username) {
    return next(createError(401, 'username required'));
  }
  if (!req.auth.password) {
    return next(createError(401, 'password required'));
  }
  next();
}