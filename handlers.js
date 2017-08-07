'use strict'

const _ = require('lodash')
const { one } = require('easy-postgres/result')
const defaultQueries = require('./sql')
const resolver = require('deep-equal-resolver')()
const factory = require('midwest/factories/rest-handlers')

const { hashPassword, generateToken } = require('./helpers')

module.exports = _.memoize((state) => {
  const queries = state.queries
    ? Object.assign({}, defaultQueries, state.queries)
    : defaultQueries

  /* should be used to deserialize a user into a session
   * given a user id */
  function getAuthenticationDetails (email, client = state.db) {
    return client.query(queries.getAuthenticationDetails, [email]).then(one)
  }

  function deserialize (id, client = state.db) {
    return client.query(queries.deserialize, [id]).then(one)
  }

  function login (user, client = state.db) {
    return client.query(queries.login, [user.email])
  }

  async function changePassword (id, password, client = state.db) {
    if (!password) return Promise.reject(new Error('Password required'))

    const hash = await hashPassword(password)

    const query = 'UPDATE users SET password=$2 WHERE id = $1 RETURNING id;'

    // TODO maybe throw error if not updated properly
    return client.query(query, [id, hash]).then((result) => !!result.rows[0].id)
  }

  function checkPasswordToken (json, client = state.db) {
    client.query(state.queries.checkPasswordToken, [ json.email, json.token ])
      .then((result) => {
        if (result.rowCount) {
          return true
        }
      })
  }

  function createEmailToken (json, client = state.db) {
    const token = generateToken()

    return client.query('INSERT INTO email_tokens (user_id, email, token) VALUES ($1, $2, $3) RETURNING token;',
      [json.userId, json.email, token]).then((result) => result.rows[0].token)
  }

  function createPasswordToken (userId, client = state.db) {
    const token = generateToken()

    return client.query('INSERT INTO password_tokens (user_id, token) VALUES ($1, $2) RETURNING token;', [userId, token])
      .then((result) => result.rows[0].token)
  }

  const { findOne: findEmailToken, update: updateEmailToken } = factory({
    table: 'email_tokens',
    columns: [ 'id', 'email', 'token', 'createdAt', 'consumedAt' ],
    include: [ 'findOne', 'update' ],
  })

  const { findOne: findPasswordToken, update: updatePasswordToken } = factory({
    table: 'password_tokens',
    columns: [ 'id', 'email', 'token', 'createdAt', 'consumedAt' ],
    include: [ 'findOne', 'update' ],
  })

  return {
    changePassword,
    checkPasswordToken,
    createEmailToken,
    createPasswordToken,
    deserialize,
    findEmailToken,
    findPasswordToken,
    getAuthenticationDetails,
    login,
    updateEmailToken,
    updatePasswordToken,
  }
}, resolver)
