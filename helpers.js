'use strict'

const crypto = require('crypto')
const scrypt = require('scrypt-for-humans')

const tokenLength = 64

function hashPassword (password) {
  return scrypt.hash(password, {})
}

function checkPassword (password, hash) {
  // return scrypt.verifyHash(password, hash)
  return scrypt.verifyHash(password, hash).catch(scrypt.PasswordError, () => {
    return false
  })
}

function generateToken (length = tokenLength) {
  return crypto.randomBytes(length / 2).toString('hex')
}

module.exports = {
  checkPassword,
  generateToken,
  hashPassword,
}
