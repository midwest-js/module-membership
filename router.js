'use strict'

const _ = require('lodash')
const express = require('express')
const resolver = require('deep-equal-resolver')()

const redirect = require('midwest/factories/redirect')

const strategies = {
  factory: require('./strategies/factory'),
  local: require('./strategies/local'),
  social: require('./strategies/social'),
}

module.exports = exports = _.memoize((state) => {
  const mw = require('./middleware')(state)
  const handlers = require('./handlers')(state)
  const helpers = require('./helpers')

  const router = new express.Router()
// ({
//       db: state.db,
//       handlers: {
//         createUser: state.handlers.users.create,
//         findUser: state.handlers.users.findOne,
//         findMatchingAdmissions: state.handlers.admissions.findMatches,
//         findInviteByEmail: state.handlers.invites.findByEmail,
//       },
//       errors: state.config.errors,
//     })
  router
    .post('/login', strategies.factory({
      errors: state.config.errors,
      strategy: strategies.local({
        errors: state.config.errors,
        getAuthenticationDetails: handlers.getAuthenticationDetails,
        checkPassword: helpers.checkPassword,
      })
    }))
    .post('/register', mw.register)
    .post('/verify-email', mw.verifyEmailWithToken)
    .post('/send-change-password-link', mw.sendChangePasswordLink)
    .post('/change-password', mw.changePasswordWithToken)
    // .get('/current', mw.getCurrent)

  if (state.providers && state.providers.length) {
    state.providers.forEach((provider) => {
      router.get('/' + provider.name, flash, strategies.social({
        errors: state.config.errors,
        findUserByToken: state.handlers.users.findByToken,
        provider,
      }))
    })
  }

  return router
}, resolver)
