const bcrypt = require('bcrypt');

function generateRandomString() {
  let size = 6;
  let charset = "abcdefghijklmnopqrxtuvwxyzABCDEFGHIJKLMNOPQRXTUVWXYZ0123456789";
  let result = "";
  for (let i = 0; i < size; i++) {
    result += charset[Math.floor(Math.random() * charset.length)];
  }
  return result;
}

function checkEmail(users, email) {
  for (let person in users) {
    if (users[person]['email'] === email) {
      return true;
    }
  }
  return false;
}

function checkPassword(users, password) {
  for (let person in users) {
    if (bcrypt.compareSync(password, users[person]['password'])) {
      return [true, users[person]['id']];
    }
  }
  return false;
}

function findUser(users, userID) {
  return users[userID] ? users[userID] : {};
}

module.exports = {generateRandomString, checkEmail, checkPassword, findUser};