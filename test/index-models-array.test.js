import path from 'path'
import should from 'should'
import _ from 'lodash'
import Sequelize from 'sequelize'
import Sequenice from '../src/sequenice'
let sequelize
let models = {}

import Project from './models/project'
import User from './models/user'

describe('sequenice example with models array', function () {
  before(function (done) {
    sequelize = new Sequelize({
      dialect: 'sqlite',
      storage: ':memory:'
    })

    /* eslint-disable no-new */
    new Sequenice(sequelize, {
      models: [Project, User],
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
  })
})
