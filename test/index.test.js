import path from 'path'
import should from 'should'
import _ from 'lodash'
import Sequelize from 'sequelize'
import Sequenice from '../src/sequenice'
let sequelize
let models = {}

describe('sequenice example', function () {
  before(function (done) {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:'
    })

    /* eslint-disable no-new */
    new Sequenice(sequelize, {
      modelsDirectory: path.resolve(__dirname, 'models'),
      modelsAttacher: models
    })
    /* eslint-enable no-new */

    sequelize.dropAllSchemas()
      .then(() => sequelize.sync())
      .then(() => done())
      .catch(err => {
        if (err instanceof Array) {
          err = _.flatten(err)[0]
        }

        throw err
      })
  })

  /**
   * Field definitions
   */
  describe('field definitions', function () {
    it('creates `User` and `Project` models and attaches them to `models`', function () {
      should.exist(models.User)
      should.exist(models.Project)
    })

    it('creates a `name` field', function (done) {
      models.User.create({ name: 'A Name' }).then(function (user) {
        should.exist(user.name)
        done()
      })
    })

    it('creates a `isAdmin` field with a default value', function (done) {
      models.User.create({ name: 'A Name' }).then(function (user) {
        user.isAdmin.should.equal(false)
        done()
      })
    })
  })

  /**
   * Class / instance methods
   */
  describe('class methods', function () {
    it('turn into sequelize class methods', function (done) {
      should.exist(models.User.classMethod)
      done()
    })
  })

  describe('instance methods', function () {
    it('turn into sequelize instance methods', function (done) {
      models.User.create({ name: 'Some name' }).then(function (user) {
        should.exist(user.instanceMethod)
        done()
      })
    })
  })

  /**
   * Associations
   */
  describe('associations definitions', function () {
    it('creates a hasMany relation from `User` to `Project`', function (done) {
      models.User.create({ name: 'A Name' }).then(function (user) {
        models.Project.create({ name: 'Project name' }).then(function (project) {
          user.setProjects([project]).then(function () {
            done()
          })
        })
      })
    })

    it('creates a belongsTo relation from `Project` to `User`', function (done) {
      models.Project.create({ name: 'Project name' }).then(function (project) {
        models.User.create({ name: 'A Name' }).then(function (user) {
          project.setUser(user).then(function () {
            done()
          })
        })
      })
    })
  })

  /**
   * Hooks
   */
  describe('hooks', function () {
    it('defines a `beforeCreate` hook', function (done) {
      models.User.create().then(function (user) {
        user.beforeCreateCalled.should.equal(true)
        done()
      })
    })
  })

  /**
   * Getters / setters
   */
  it('defines getters and setters', function (done) {
    models.User.build({ price: 20 }).priceInCents.should.equal(20 * 100)
    models.User.build({ priceInCents: 30 * 100 }).price.should.equal('$30')

    done()
  })

  /**
   * Options
   */
  it('should apply the options', function (done) {
    sequelize.queryInterface.describeTable('Projects').then(function (columns) {
      should.not.exist(columns.createdAt)
      should.not.exist(columns.updatedAt)

      done()
    })
  })
})
