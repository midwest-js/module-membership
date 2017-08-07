'use strict'

const _ = require('lodash')
const oki = require('oki')

const createError = require('midwest/util/create-error')
const resolver = require('deep-equal-resolver')({
  moduleName: 'midwest-membership/strategies/factory',
  validate: oki({
    'errors.emailNotVerified': _.isPlainObject,
    'errors.blocked': _.isPlainObject,
    'errors.banned': _.isPlainObject,
  }),
})

const responses = {
  json (req, res, user) {
    if (req.session.previousUrl) res.set('Location', req.session.previousUrl)

    res.json(user)
  },

  html (req, res) {
    res.redirect(req.session.previousUrl || '/')
  },
}

module.exports = _.memoize((state) => {
  return function authenticate (req, res, next) {
    return state.strategy(req, res, next).then((user) => {
      if (state.requireVerification && !user.emailVerifiedAt) {
        throw createError(state.config.errors.emailNotVerified)
      } else if (user.blockedAt) {
        throw createError(state.config.errors.blocked)
      } else if (user.bannedAt) {
        throw createError(state.config.errors.banned)
      }

      if (req.body.remember && _.get(state, 'config.remember')) {
        if (state.config.remember.expires) {
          req.session.cookie.expires = state.config.remember.expires
        } else {
          req.session.cookie.maxAge = state.config.remember.maxAge
        }
      }

      console.log('about to login')
      return req.login(user).then(() => {
        delete user.password

        res.status(200)

        console.log('about to respond')
        responses[req.accepts(['json', 'html'])](req, res, user)
      })
    }).catch((err) => {
      if (req.body.password) {
        req.body.password = 'DELETED'
      }

      next(err)
    })
  }
}, resolver)
