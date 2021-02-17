const { assert } = require('chai');
const { checkEmail, findUser } = require('../helpers.js');

const testUsers = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
  "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  }
};

describe('checkEmail', function() {
  it('should return true with valid email', function() {
    const value = checkEmail(testUsers, "user@example.com");
    assert.isTrue(value);
  });

  it('should return false with valid email', function() {
    const value = checkEmail(testUsers, "user12312@example.com");
    assert.isFalse(value);
  });
});

describe('findUser', function() {
  it('should return the userID object with valid userID', function() {
    const obj = findUser(testUsers, "userRandomID");
    const result = {
      id: "userRandomID",
      email: "user@example.com",
      password: "purple-monkey-dinosaur"
    };
    assert.deepEqual(obj,result);
  });

  it('should return an empty object with an invalid userID', function() {
    const obj = findUser(testUsers, "blep");
    const result = {};
    assert.deepEqual(obj,result);
  });

});


