'use strict'

/*
 * adonis-antl
 *
 * (c) Harminder Virk <virk@adonisjs.com>
 *
 * For the full copyright and license information, please view the LICENSE
 * file that was distributed with this source code.
*/

const chai = require('chai')
const fs = require('co-fs-extra')
const setup = require('./setup')
const Database = require('adonis-lucid/src/Database')
const Antl = require('../src/Antl')
const Formats = require('../src/Formats')
const File = require('../src/Antl/Drivers').file
const DatabaseDriver = require('../src/Antl/Drivers').database
const clearRequire = require('clear-require')
const assert = chai.assert
require('co-mocha')

describe('Antl', function () {
  beforeEach(function () {
    Formats.clear()
  })

  context('Raw Messages', function () {
    it('should return the current locale', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.getLocale(), 'en')
    })

    it('should return true when current locale is same as the defined locale', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.getLocale(), 'en')
    })

    it('should be able to update the current locale', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.isLocale('en'), true)
    })

    it('should be able to update the current locale', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.isLocale('en'), true)
    })

    it('should be able to format a number for en locale', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.formatNumber('1000'), '1,000')
    })

    it('should be able to format a number for fr-fr locale', function () {
      const antl = new Antl(setup.Config)
      antl.setLocale('fr-fr')
      assert.equal(antl.formatNumber('1000'), '1 000')
    })

    it('should be able to define a short lived locale for a single method', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.for('fr-fr').formatNumber('1000'), '1 000')
    })

    it('should clear the short lived locale immediately', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.for('fr-fr').formatNumber('1000'), '1 000')
      assert.equal(antl.formatNumber('1000'), '1,000')
    })

    it('should be able to format number as a currency value', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.formatNumber('1000', { style: 'currency', currency: 'USD' }), '$1,000.00')
    })

    it('should be able to format number using a predefined format', function () {
      Formats.addFormat('curr', {style: 'currency'})
      const antl = new Antl(setup.Config)
      assert.equal(antl.formatNumber('1000', { format: 'curr', currency: 'USD' }), '$1,000.00')
    })

    it('should be able to format currency using the amount method', function () {
      const antl = new Antl(setup.Config)
      assert.equal(antl.formatAmount('1000', 'USD', {localeMatcher: 'lookup'}), '$1,000.00')
    })

    it('should be able to format date', function () {
      const antl = new Antl(setup.Config)
      const currentDate = new Date()
      assert.equal(antl.formatDate(currentDate), `${(currentDate.getMonth() + 1)}/${currentDate.getDate()}/${currentDate.getFullYear()}`)
    })

    it('should be able to format a message', function () {
      const antl = new Antl(setup.Config)
      const message = antl
        .formatMessage('You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}', {numPhotos: 1})
      assert.equal(message, 'You have one photo.')
    })

    it('should be able to format a message with runtime currency code', function () {
      const antl = new Antl(setup.Config)
      Formats.addFormat('curr', { style: 'currency' })
      const message = antl
        .formatMessage('You have to pay {total, number, curr}', {total: 30}, (message) => {
          message.passFormat('curr').to('number').withValues({currency: 'USD'})
        })
      assert.equal(message, 'You have to pay $30.00')
    })

    it('should be able to format a message with runtime currency code injected via string expression', function () {
      const antl = new Antl(setup.Config)
      Formats.addFormat('curr', { style: 'currency' })
      const message = antl
        .formatMessage('You have to pay {total, number, curr}', {total: 30}, 'curr:number[currency=USD]')
      assert.equal(message, 'You have to pay $30.00')
    })

    it('should be able to form a complex message with predefined formats', function () {
      const antl = new Antl(setup.Config)
      Formats.addFormat('curr', { style: 'currency' })
      Formats.addFormat('per', {style: 'percent'})
      const message = antl
        .formatMessage('You have to pay {total, number, curr} with tax of {tax, number, per}', {total: 30, tax: 0.1}, (message) => {
          message.passFormat('curr').to('number').withValues({currency: 'USD'})
          message.passFormat('per').to('number')
        })
      assert.equal(message, 'You have to pay $30.00 with tax of 10%')
    })

    it('should be able to format a date to the relative unit', function () {
      const antl = new Antl(setup.Config)
      const before3Hours = new Date().setHours(new Date().getHours() - 3)
      const message = antl.formatRelative(before3Hours)
      assert.equal(message, '3 hours ago')
    })

    it('should return the difference back in minutes', function () {
      const antl = new Antl(setup.Config)
      const before3Hours = new Date().setHours(new Date().getHours() - 3)
      const message = antl.formatRelative(before3Hours, {units: 'minute'})
      assert.equal(message, '180 minutes ago')
    })

    it('should return the difference back in numeric style', function () {
      const antl = new Antl(setup.Config)
      const before3Hours = new Date().setDate(new Date().getDate() - 1)
      const message = antl.formatRelative(before3Hours, {style: 'numeric'})
      assert.equal(message, '1 day ago')
    })

    it('should be able to use existing currency formats', function () {
      const antl = new Antl(setup.Config)
      clearRequire('../src/Antl/formats')
      require('../src/Antl/formats')
      const message = antl.formatNumber(1000, { format: 'usd' })
      assert.equal(message, '$1,000.00')
    })

    it('should be able to use existing hhmmss format', function () {
      const antl = new Antl(setup.Config)
      clearRequire('../src/Antl/formats')
      require('../src/Antl/formats')
      const message = antl.formatDate(new Date(), {format: 'hhmmss'})
      assert.match(message, /\d+:\d+:\d+\s\w{2}/)
    })

    it('should be able to pass additional values existing hhmmss format', function () {
      const antl = new Antl(setup.Config)
      clearRequire('../src/Antl/formats')
      require('../src/Antl/formats')
      const message = antl.formatDate(new Date(), {format: 'hhmmss', hour12: false})
      assert.match(message, /\d+:\d+:\d+/)
    })

    it('should be able to use existing ddyymm format', function () {
      const antl = new Antl(setup.Config)
      clearRequire('../src/Antl/formats')
      require('../src/Antl/formats')
      const message = antl.formatDate(new Date(), {format: 'ddyymm'})
      assert.match(message, /\d+\/\d+\/\d{4}/)
    })
  })

  context('Via File Driver', function () {
    afterEach(function * () {
      const defaultLocaleValues = {
        en: {
          greeting: 'Hello world',
          'is.admin': 'false',
          photos: 'You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}'
        },
        fr: {
          billAmount: 'You have to pay {amount, number, curr}'
        }
      }
      yield fs.writeJson(setup.Helpers.resourcesPath('locales/en/messages.json'), defaultLocaleValues.en)
      yield fs.writeJson(setup.Helpers.resourcesPath('locales/fr/messages.json'), defaultLocaleValues.fr)
      yield fs.remove(setup.Helpers.resourcesPath('locales/fr/notifications.json'))
    })

    it('should not call the driver load method when loaded the locales once', function * () {
      let calledTimes = 0
      const driver = new File(setup.Helpers)
      driver.load = function * () {
        calledTimes++
      }
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      assert.equal(antl._stringsLoaded, true)
      yield antl.load()
      yield antl.load()
      assert.equal(calledTimes, 1)
    })

    it('should call the driver load method when reload method is called', function * () {
      let calledTimes = 0
      const driver = new File(setup.Helpers)
      driver.load = function * () {
        calledTimes++
      }
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      assert.equal(antl._stringsLoaded, true)
      yield antl.load()
      yield antl.load()
      yield antl.reload()
      assert.equal(calledTimes, 2)
    })

    it('should be able to get a string value for the active locale', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const message = antl.get('messages.photos')
      assert.equal(message, 'You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}')
    })

    it('should be able to get a string value for a custom locale', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const message = antl.for('fr').get('messages.billAmount')
      assert.equal(message, 'You have to pay {amount, number, curr}')
    })

    it('should be able to add a new string and value for a custom locale', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      yield antl.for('fr').set('messages', 'greeting', 'Bonjour')
      const fileContents = yield fs.readJson(setup.Helpers.resourcesPath('locales/fr/messages.json'))
      assert.equal(fileContents.greeting, 'Bonjour')
      const message = antl.for('fr').get('messages.greeting')
      assert.equal(message, 'Bonjour')
    })

    it('should be create the file when trying to set the value for a non-existing group', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      yield antl.for('fr').set('notifications', 'alert', 'Stay alert')
      const fileContents = yield fs.readJson(setup.Helpers.resourcesPath('locales/fr/notifications.json'))
      assert.equal(fileContents.alert, 'Stay alert')
      const message = antl.for('fr').get('notifications.alert')
      assert.equal(message, 'Stay alert')
    })

    it('should format a message defined inside the locales directory', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const message = antl.formatMessage('messages.photos', {numPhotos: 1})
      assert.equal(message, 'You have one photo.')
    })

    it('should be able to change locale on runtime and format the string', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      Formats.addFormat('curr', {style: 'currency'})
      yield antl.load()
      antl.setLocale('fr')
      const message = antl.formatMessage('messages.billAmount', {amount: 1000}, (message) => {
        message.passFormat('curr').to('number').withValues({currency: 'usd'})
      })
      assert.equal(message, 'You have to pay 1 000,00 $US')
    })

    it('should return a list of active locales', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const localesLists = antl.locales()
      assert.deepEqual(localesLists, ['*', 'en', 'fr'])
    })

    it('should return a list of messages for default locale', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messagesList = antl.strings()
      assert.property(messagesList, 'messages')
      assert.deepEqual(Object.keys(messagesList.messages), ['greeting', 'is.admin', 'photos'])
    })

    it('should return a null when strings for a undefined locale is accessed', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messagesList = antl.for('du').strings()
      assert.equal(messagesList, null)
    })

    it('should return a null when pair for a undefined locale is accessed', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messagesList = antl.for('du').pair()
      assert.equal(messagesList, null)
    })

    it('should return a list of messages for a custom locale', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messagesList = antl.for('fr').strings()
      assert.property(messagesList, 'messages')
      assert.deepEqual(Object.keys(messagesList.messages), ['billAmount'])
    })

    it('should be able to set a message for a given locale', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      Formats.addFormat('curr', {style: 'currency'})
      yield antl.for('fr').set('messages', 'billAmount', 'Pay Now {amount, number, curr}')
      const message = antl
        .for('fr')
        .formatMessage('messages.billAmount', {amount: 1000}, (message) => {
          message.passFormat('curr').to('number').withValues({currency: 'usd'})
        })
      assert.equal(message, 'Pay Now 1 000,00 $US')
    })

    it('should be able to set a message for a given locale with dot notation', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      Formats.addFormat('curr', {style: 'currency'})
      yield antl.set('messages', 'is.admin', 'true')
      const message = antl.get('messages.is.admin')
      assert.equal(message, 'true')
    })

    it('should return a list of flat locale strings', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const pair = antl.pair()
      assert.equal(pair['messages.greeting'], 'Hello world')
    })

    it('should return a list of flat locale strings for a different locale', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const pair = antl.for('fr').pair()
      assert.equal(pair['messages.billAmount'], 'You have to pay {amount, number, curr}')
    })

    it('should fallback to * locale when string for a given locale does not exists', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const message = antl.formatMessage('messages.user.shout')
      assert.equal(message, 'Listen to me!')
    })

    it('should be able to format a message that contains a dot(.)', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const message = antl.formatMessage('messages.is.admin')
      assert.equal(message, 'false')
    })

    it('should be able get strings for a group', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messages = antl.strings('messages')
      assert.deepEqual(messages, {greeting: 'Hello world', 'is.admin': 'false', photos: 'You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}'})
    })

    it('should be able get pair for a group', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messages = antl.pair('messages')
      assert.deepEqual(messages, {greeting: 'Hello world', 'is.admin': 'false', photos: 'You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}'})
    })

    it('should be able to remove locale string value from the store', function * () {
      const driver = new File(setup.Helpers)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      yield antl.remove('messages', 'greeting')
      const message = antl.formatMessage('messages.greeting')
      assert.equal(message, 'messages.greeting')
    })
  })

  context('Via Database Driver', function () {
    before(function * () {
      yield fs.ensureDir(setup.Helpers.databasePath())
      Database._setConfigProvider(setup.Config)
      yield Database.schema.createTable('locales', (table) => {
        table.increments()
        table.string('locale')
        table.string('group')
        table.string('item')
        table.text('text')
      })
    })

    beforeEach(function * () {
      yield Database.table('locales').insert([
        {
          item: 'photos',
          group: 'messages',
          locale: 'en',
          text: 'You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}'
        }, {
          item: 'is.admin',
          group: 'messages',
          locale: 'en',
          text: 'false'
        }, {
          item: 'billAmount',
          group: 'messages',
          locale: 'fr',
          text: 'You have to pay {amount, number, curr}'
        }
      ])
    })

    after(function * () {
      yield Database.schema.dropTable('locales')
    })

    afterEach(function * () {
      yield Database.truncate('locales')
    })

    it('should not call the driver load method when loaded the locales once', function * () {
      let calledTimes = 0
      const driver = new DatabaseDriver(Database)
      driver.load = function * () {
        calledTimes++
      }
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      assert.equal(antl._stringsLoaded, true)
      yield antl.load()
      yield antl.load()
      assert.equal(calledTimes, 1)
    })

    it('should format a message defined inside the locales directory', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const message = antl.formatMessage('messages.photos', {numPhotos: 1})
      assert.equal(message, 'You have one photo.')
    })

    it('should be able to change locale on runtime and format the string', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      Formats.addFormat('curr', {style: 'currency'})
      yield antl.load()
      antl.setLocale('fr')
      const message = antl.formatMessage('messages.billAmount', {amount: 1000}, (message) => {
        message.passFormat('curr').to('number').withValues({currency: 'usd'})
      })
      assert.equal(message, 'You have to pay 1 000,00 $US')
    })

    it('should return a list of active locales', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const localesLists = antl.locales()
      assert.deepEqual(localesLists, ['en', 'fr'])
    })

    it('should return a list of messages for default locale', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messagesList = antl.strings()
      assert.property(messagesList, 'messages')
      assert.deepEqual(Object.keys(messagesList.messages), ['photos', 'is.admin'])
    })

    it('should be able to add a new string and value for a custom locale', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      yield antl.for('fr').set('messages', 'greeting', 'Bonjour')
      const savedString = yield Database.from('locales').where({ locale: 'fr', group: 'messages', item: 'greeting' }).first()
      assert.equal(savedString.text, 'Bonjour')
      const message = antl.for('fr').get('messages.greeting')
      assert.equal(message, 'Bonjour')
    })

    it('should return a list of messages for a custom locale', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messagesList = antl.for('fr').strings()
      assert.property(messagesList, 'messages')
      assert.deepEqual(Object.keys(messagesList.messages), ['billAmount'])
    })

    it('should be able to set a message for a given locale', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      Formats.addFormat('curr', {style: 'currency'})
      yield antl.for('fr').set('messages', 'billAmount', 'Pay Now {amount, number, curr}')
      const savedString = yield Database.from('locales').where({ locale: 'fr', group: 'messages', item: 'billAmount' }).first()
      assert.equal(savedString.text, 'Pay Now {amount, number, curr}')

      const message = antl
        .for('fr')
        .formatMessage('messages.billAmount', {amount: 1000}, (message) => {
          message.passFormat('curr').to('number').withValues({currency: 'usd'})
        })
      assert.equal(message, 'Pay Now 1 000,00 $US')
    })

    it('should return a list of flat locale strings', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const pair = antl.pair()
      assert.equal(pair['messages.photos'], 'You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}')
    })

    it('should return a list of flat locale strings for a different locale', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const pair = antl.for('fr').pair()
      assert.equal(pair['messages.billAmount'], 'You have to pay {amount, number, curr}')
    })

    it('should be able to format a message that contains a dot(.)', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const message = antl.formatMessage('messages.is.admin')
      assert.equal(message, 'false')
    })

    it('should be able get strings for a group', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messages = antl.strings('messages')
      assert.deepEqual(messages, {'is.admin': 'false', photos: 'You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}'})
    })

    it('should be able get pair for a group', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      const messages = antl.pair('messages')
      assert.deepEqual(messages, {'is.admin': 'false', photos: 'You have {numPhotos, plural, =0 {no photos.} =1 {one photo.} other {# photos.}}'})
    })

    it('should be able to remove locale string value from the store', function * () {
      const driver = new DatabaseDriver(Database)
      const antl = new Antl(setup.Config, driver)
      yield antl.load()
      yield antl.remove('messages', 'is.admin')
      const removedString = yield Database.from('locales').where({ locale: 'en', group: 'messages', item: 'is.admin' }).first()
      assert.equal(removedString, undefined)

      const message = antl.formatMessage('messages.is.admin')
      assert.equal(message, 'messages.is.admin')
    })
  })
})
