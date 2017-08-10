'use strict';

const expect = require('chai').expect;
const request = require('superagent')
const Promise = require('bluebird');
const mongoose = require('mongoose');

const User = require('../model/user.js');
const Profile = require('../model/profile.js');

const url = `http://localhost:${process.env.PORT}`;

const exampleUser = {
  username: 'exampleUser',
  password: '1234',
  email: 'exampleuser@test.com'
}

const exampleProfile = {
  name: 'test profile',
  desc: 'test profile description'
}

describe('Profile Routes', function () {
  afterEach(done => {
    Promise.all([
      User.remove({}),
      Profile.remove({})
    ])
      .then(() => done())
      .catch(done);
  });

  describe('POST: /api/profile', () => {
    before(done => {
      new User(exampleUser)
        .generatePasswordHash(exampleUser.password)
        .then(user => user.save())
        .then(user => {
          this.tempUser = user;
          return user.generateToken();
        })
        .then(token => {
          this.tempToken = token;
          done();
        })
        .catch(done);
    });

    it('should return a profile', done => {
      request.post(`${url}/api/profile`)
        .send(exampleProfile)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          if (err) return done(err);
          let date = new Date(res.body.created).toString();
          expect(res.body.name).to.equal(exampleProfile.name);
          expect(res.body.desc).to.equal(exampleProfile.desc);
          expect(res.body.userID).to.equal(this.tempUser._id.toString());
          expect(date).to.not.equal('Invalid Date');
          done();
        });
    });
  });

  describe('GET: /api/profile/:id', () => {
    before(done => {
      new User(exampleUser)
        .generatePasswordHash(exampleUser.password)
        .then(user => user.save())
        .then(user => {
          this.tempUser = user;
          return user.generateToken()
        })
        .then(token => {
          this.tempToken = token;
          done();
        })
        .catch(done);
    });

    before(done => {
      exampleProfile.userID = this.tempUser._id.toString();
      new Profile(exampleProfile).save()
        .then(profile => {
          this.tempProfile = profile;
          done();
        })
        .catch(done);
    });

    after(() => {
      delete exampleProfile.userID;
    });

    it('should return a profile', done => {
      request.get(`${url}/api/profile/${this.tempProfile._id}`)
        .set({
          Authorization: `Bearer ${this.tempToken}`
        })
        .end((err, res) => {
          if (err) return done(err);
          let date = new Date(res.body.created).toString();
          expect(res.body.name).to.equal(exampleProfile.name);
          expect(res.body.desc).to.equal(exampleProfile.desc);
          expect(res.body.userID).to.equal(this.tempUser._id.toString());
          expect(date).to.not.equal('Invalid Date');
          done();
        })
    })
  })
});