'use strict'

const h = require('hyperscript-jsx/string')

module.exports = (props) => (
  h('table', { align: 'center', width: '600' },
    h('tr', null,
      h('td', { style: 'text-align: center; font-family: Arial, sans-serif;', valign: 'top' },
        h('h1', null, 'Hi'),
        h('p', null, 'A password change request has been initiated for your account at ',
          h('a', { href: props.site.url }, props.site.title),
            '. Please follow the link below to finalize the change:'
          ),
        h('p', null,
          h('a', { href: props.link }, props.link)
        ),
        h('p', null, 'This link is only active for 24 hours.'),
        h('p', null,
          h('strong', null, 'This is an automated email, please do not reply to it.')
        )
      )
    )
  )
)
