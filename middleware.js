'use strict'

const url = require('url')
const _ = require('lodash')
const oki = require('oki')

const createError = require('midwest/util/create-error')
const resolver = require('deep-equal-resolver')({
  moduleName: 'midwest-membership/middleware',
  validate: oki({
    db: (value) => {
      const keys = ['query', 'connect', 'begin']

      return keys.every((key) => _.has(value, key))
    },
    'config.errors.duplicateEmail': _.isPlainObject,
    'config.errors.notAuthorized': _.isPlainObject,
    'config.errors.missingParameters': _.isPlainObject,
    'config.errors.tokenNotFound': _.isPlainObject,
    'config.errors.tokenExpired': _.isPlainObject,
    'handlers.createUser': _.isFunction,
    'handlers.findUser': _.isFunction,
    'handlers.findInviteByEmail': _.isFunction,
    'handlers.findAdmissionsFromEmail': _.isFunction,
    'handlers.updateUser': _.isFunction,
    'handlers.addRolesToUser': _.isFunction,
  }),
})

const defaultTemplates = require('./templates')

module.exports = _.memoize((state) => {
  const { config, db } = state
  const handlers = require('./handlers')(state)

  function changePasswordWithToken (req, res, next) {
    // hide password in body
    // if (!req.body.email || !req.body.password || !req.body.token) {
    if (!req.body.password) {
      return createError(config.errors.missingParameters)
    }

    handlers.findPasswordToken({ email: req.body.email, token: req.body.token }).then((passwordToken) => {
      if (!passwordToken) {
        throw createError('Incorrect token/and or email', 404)
      } else if (Date.now() > passwordToken.createAt + state.config.timeouts.changePassword) {
        throw createError(config.errors.expiredToken)
      }

      return handlers.changePassword(passwordToken.userId, req.body.password).then(() => {
        res.sendStatus(204)
      })
    }).catch((err) => {
      if (req.body.password) {
        req.body.password = 'DELETED'
      }

      next(err)
    })
  }

  // middleware that checks if an email and token are valid
  function checkPasswordToken (req, res, next) {
    handlers.findPasswordToken({ email: req.body.email, token: req.body.token }).then((passwordToken) => {
      if (!passwordToken) {
        throw createError('Token not found', 404)
      } else if (Date.now() > passwordToken.createdAt.getTime() + (24 * 60 * 60 * 1000)) {
        throw createError('Token has expired', 410)
      }

      next()
    }).catch((err) => {
      if (req.body.password) {
        req.body.password = 'DELETED'
      }

      next(err)
    })
  }

  // helper for register
  function getRoles (email) {
    return state.handlers.findInviteByEmail(email).then((invite) => {
      let roles = invite ? invite.roles : []

      return state.handlers.findAdmissionsFromEmail(email).then((admissions) => {
        if (admissions) {
          roles = _.union(roles, ...admissions.map((admission) => admission.roles))
        }

        return { roles, invite }
      })
    })
  }

  function register (req, res, next) {
    const social = req.flash('social')[0]

    if (social) {
      Object.assign(req.body, _.pick(social.profile, 'givenName', 'familyName', 'email', 'gender'), {
        [social.provider + 'Id']: social.profile.id,
        [social.provider + 'Token']: social.token.value,
      })
    } else {
      // TODO remove any provider id's or tokens from req.body
    }

    // TODO validate!
    req.body.email = req.body.email.trim().toLowerCase()

    state.handlers.findUser({ email: req.body.email }).then((user) => {
      if (user) {
        throw createError(config.errors.duplicateEmail)
      }

      return getRoles(req.body.email)
    }).then(async ({ roles, invite }) => {
      if (!roles) {
        throw createError(config.errors.notAuthorized)
      }

      const newUser = _.merge({}, req.body, { roles })

      // TEMP
      if (invite) newUser.emailVerifiedAt = new Date()

      const t = await db.begin()
      const user = await handlers.createUser(newUser, t)

      await state.handlers.addRolesToUser(user.id, roles)

      if (!user.emailVerifiedAt) {
        const token = await state.createEmailToken({ userId: user.id, email: user.email }, t)

        user.emailToken = token
      }

      await t.commit()

      let promise

      if (user.emailToken) {
        const link = `${url.resolve(config.site.url, config.auth.paths.verifyEmail)}?email=${user.email}&token=${user.emailToken.token}`

        promise = state.transport({
          to: user.email,
          from: 'Blox Robot <robot@millerkonsult.se>',
          subject: `Verify Blox account`,
          html: defaultTemplates.verifyEmail({ site: config.site, user: user, link }),
        })
      } else {
        promise = req.login(user).then(() => state.transport({
          to: user.email,
          from: 'Blox Robot <robot@millerkonsult.se>',
          subject: 'Welcome to Blox',
          html: defaultTemplates.welcome({ site: config.site, user: user }),
        }))
      }

      promise.then(() => {
        if (req.accepts(['json', '*/*'] === 'json')) {
          return res.status(201).json(_.omit(user, 'password'))
        }

        res.redirect(config.redirects.register)
      })
    }).catch((err) => {
      if (req.body.password) {
        req.body.password = 'DELETED'
      }

      if (req.body.confirmPassword) {
        req.body.confirmPassword = 'DELETED'
      }

      next(err)
    })
  }

  function sendChangePasswordLink (req, res, next) {
    const { email } = req.body

    state.handlers.findUser({ email }).then((result) => {
      return Promise.all([
        result,
        handlers.createPasswordToken(),
      ]).then(([ user, token ]) => {
        state.sendEmail({
          to: user.email,
          from: `${config.site.title} <${config.site.emails.robot}>`,
          subject: `Welcome to ${config.site.title}!`,
          html: template({ site: config.site, user: user }),
        })
      })
    })
  }

  function verifyEmailWithToken (req, res, next) {
    const { token, email } = req.query

    handlers.findEmailToken({ email, token }).then((emailToken) => {
      if (!token) {
        throw createError('Incorrect token and/or email', 404)
      } else if (token.consumedAt) {
        throw createError('Token already consumed', 410)
      } else if (Date.now() > emailToken.createdAt.getTime() + (24 * 60 * 60 * 1000)) {
        throw createError('Token has expired', 410)
      }

      const now = new Date()

      return Promise.all([
        handlers.updateEmailToken(emailToken.id, { consumedAt: now }),
        state.handlers.updateUser(emailToken.userId, { emailVerifiedAt: now, email: email }),
      ]).then(([ emailToken, user ]) => {

      })
    })
  }

  return {
    checkPasswordToken,
    changePasswordWithToken,
    register,
    sendChangePasswordLink,
    verifyEmailWithToken,
  }
}, resolver)
