'use strict'

const _ = require('lodash')
const oki = require('oki')
const createError = require('midwest/util/create-error')
const resolver = require('deep-equal-resolver')({
  moduleName: 'midwest-membership/strategies/local',
  validate: oki({
    'errors.wrongPassword': _.isPlainObject,
    'errors.noUserFound': _.isPlainObject,
    'errors.notLocal': _.isPlainObject,
    'getAuthenticationDetails': _.isFunction,
    'checkPassword': _.isFunction,
  }),
})

module.exports = _.memoize((state) => {
  return (req, res, next) => {
    const { email, password } = req.body

    return state.getAuthenticationDetails(email.toLowerCase()).then((user) => {
      if (!user) {
        throw createError(state.errors.noUserFound)
      } else if (!user.password) {
        throw createError(state.errors.notLocal)
      }

      return state.checkPassword(password, user.password).then((result) => {
        if (!result) {
          console.log('about to throw error')
          throw createError(state.errors.wrongPassword)
        }

        return user
      })
    })
  }
}, resolver)
