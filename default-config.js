'use strict'

const queries = require('./sql')

module.exports = {
  invite: {
    from: 'Robot <robot@example.io>',
    subject: 'You have been invited to a Midwest Website',
  },

  errors: {
    banned: {
      message: 'User is banned.',
      status: 401,
    },

    blocked: {
      message: 'User is blocked due to too many login attempts.',
      status: 401,
    },

    duplicateEmail: {
      message: 'The email has already been registered.',
      status: 409,
    },

    emailNotVerified: {
      message: 'This account\'s email has not been verified.',
      status: 401,
    },

    externalLoginFailed: {
      message: 'External login failed.',
      status: 504,
    },

    missingParameters: {
      message: 'Oh no missing stuff',
      status: 422,
    },

    noExternalUser: {
      message: 'The account is not connected to this website.',
      status: 400,
    },

    noUserFound: {
      message: 'No user registered with that email.',
      status: 400,
    },

    notAuthorized: {
      message: 'The email is not authorized to create an account.',
      status: 401,
    },

    notLocal: {
      message: 'Account requires external login.',
      status: 400,
    },

    tokenExpired: {
      message: 'Token expired',
      status: 410,
    },

    tokenNotFound: {
      message: 'Token not found',
      status: 404,
    },

    wrongPassword: {
      message: 'Wrong password.',
      status: 401,
    },
  },

  paths: {
    forgotPassword: '/forgot-password',
    login: '/login',
    register: '/register',
    changePassword: '/change-password',
    verifyEmail: '/verify-email',
  },

  redirects: {
    login: '/',
    logout: '/',
    register: '/',
  },

  remember: {
    // if expires is defined, it will be used. otherwise maxage
    expires: new Date('2038-01-19T03:14:07.000Z'),
    // expires: Date.now() - 1,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },

  timeouts: {
    // 1 day
    changePassword: 24 * 60 * 60 * 1000,
    // verify email
    verifyEmail: 7 * 24 * 60 * 60 * 1000,
  },

  services: {
    users: {
      columns: ['givenName', 'familyName', 'mutedAt', 'mutedById', 'verifiedAt'],
    },
  },

  session: {
    queries: {
      deserialize: queries.deserialize,
    },
  },
}
