'use strict';

const expect = require('chai').expect;
const request = require('superagent');
const debug = require('debug')('cfgram:banger-route-test');

const Banger = require('../model/banger.js');
const User = require('../model/user.js');
const Profile = require('../model/profile.js');

require('../server.js');

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

const exampleBanger = {
  name: 'example banger',
  desc: 'example banger description',
  mp3: `${__dirname}/../data/banger.png`
}

describe('Banger Routes', function () {
  afterEach(done => {
    Promise.all([
      Banger.remove({}),
      User.remove({}),
      Profile.remove({})
    ])
      .then(() => done())
      .catch(done);
  });

  describe('POST: /api/profile/:profileID/banger', function () {  // instaction update save
    describe('with a valid token and valid data', function () {
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

      before( done => {
        exampleProfile.userID = this.tempUser._id.toString();
        new Profile(exampleProfile).save()
          .then(profile => {
            this.tempProfile = profile;
            done(); 
          })
          .catch(done);
      });

      after(done => {
        delete exampleProfile.userID;
        done();
      });

      it('should return a banger', done => {
        request.post(`${url}/api/profile/${this.tempProfile._id}/banger`)
          .set({
            Authorization: `Bearer ${this.tempToken}`
          })
          .field('name', exampleBanger.name)
          .field('desc', exampleBanger.desc)
          .attach('image', exampleBanger.mp3)
          .end((err, res) => {
            if (err) return done(err);
            expect(res.status).to.equal(200);
            expect(res.body.name).to.equal(exampleBanger.name);
            expect(res.body.desc).to.equal(exampleBanger.desc);
            expect(res.body.profileID).to.equal(this.tempProfile._id.toString());
            done();
          });
      });
    });
  });
});



