'use strict'

const _ = require('lodash')
const express = require('express')
const resolver = require('deep-equal-resolver')({ log: true })

const defaultConfig = require('./default-config')

module.exports = _.memoize((state) => {
  state.config = defaultConfig

  const { deserialize } = require('./handlers')(state)

  require('midwest-membership-session').assignTo({
    userGetter: true,
    serialize: (user) => Promise.resolve(user.id),
    deserialize: deserialize,
    target: express.request,
  })

  // const router = new express.Router()
  const router = require('./router')(state)

  return router
}, resolver)
