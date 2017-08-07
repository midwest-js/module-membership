'use strict'

const h = require('hyperscript-jsx')

module.exports = ({ site, user } = {}) => (
  h('table', { align: 'center', width: '600' },
    h('tr', null,
      h('td', { style: 'text-align: center; font-family: Arial, sans-serif;', valign: 'top' },
        h('h1', null, `Hi ${(user && user.name) || user.email}!`),
        h('p', null, `You have now been registered at ${site && site.title}.`),
        h('p', null,
          h('strong', null, 'This email is automatically generated.')
        )
      )
    )
  )
)
