'use strict'

const h = require('hyperscript-jsx/string')

module.exports = ({ link, site, user }) => (
  h('table', { align: 'center', width: '600' },
    h('tr', null,
      h('td', { style: 'text-align: center; font-family: Arial, sans-serif;', valign: 'top' },
        h('h1', null, 'Hello'),
        h('p', null, 'You have almost completed your registration process! All you need to do now is click on the link below to verify your email address.'),
        h('p', null,
          h('a', { href: link }, link)
        ),
        h('p', null, 'This link will only be active for 48 hours.'),
        h('p', null,
          h('strong', null, 'This email is autogenerated and cannot be replied to.')
        )
      )
    )
  )
)
