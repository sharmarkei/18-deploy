'use strict';

const fs = require('fs');
const path = require('path');
const del = require('del');
const AWS = require('aws-sdk');
const multer = require('multer');
const Router = require('express').Router;
const createError = require('http-errors');
const debug = require('debug')('cfgram:banger-router');

const Banger = require('../model/banger.js');
const Profile = require('../model/profile.js');
const bearerAuth = require('../lib/bearer-auth-middleware.js');

AWS.config.setPromisesDependency(require('bluebird'));

const s3 = new AWS.S3();
const dataDir = `${__dirname}/../data`;
const upload = multer({ dest: dataDir})

const bangerRouter = module.exports = Router();

function s3uploadProm(params) {
  return new Promise((resolve, reject) => {
    s3.upload(params, (err, s3data) => {
      resolve(s3data);
    });
  });
}

bangerRouter.post('/api/profile/:profileID/banger', bearerAuth, upload.single('image'), function(req, res, next) {
  debug('POST: /api/profile/:profileID/banger');
  console.log('*****:', req.file)

  if (!req.file) {
    return next(createError(400, 'slapper not found fam'));
  }
  if (!req.file.path) {
    return next(createError(500, 'slapper not saved fam'));
  }
  
  let ext = path.extname(req.file.originalname);

  let params = {
    ACL: 'public-read',
    Bucket: process.env.AWS_BUCKET,
    Key: `${req.file.filename}${ext}`,
    Body: fs.createReadStream(req.file.path)
  }

  Profile.findById(req.params.profileID)
  .then( () => s3uploadProm(params))
  .then( s3data => {
    console.log('############:',s3data);
    del([`${dataDir}/*`]);
    let bangerData = {
      name: req.body.name,
      desc: req.body.desc,
      objectKey: s3data.Key,
      imageURI: s3data.Location,
      userID: req.user._id,
      profileID: req.params.profileID
    }
    return new Banger(bangerData).save();
  })
  .then( banger => res.json(banger))
  .catch( err => next(err));
});