/* global __non_webpack_require__ */
import path from 'path'
import fs from 'fs'

import _ from 'lodash'

import globule from 'globule'
import DataTypes from 'sequelize/lib/data-types'

export default class Sequenize {
  constructor (sequelize, options) {
    this.sequelize = sequelize
    this.models = {}

    if (!options.modelsDirectory && !options.models) {
      throw new Error('Sequenice: No `modelsDirectory` or `models` given.')
    }

    this._options = _.clone(options)
    _.defaults(this._options, {
      modelsDirectory: null,
      modelsAttacher: global,
      getterPrefix: '_get',
      setterPrefix: '_set',
      modelsMatch: /\.(js|coffee)$/i
    })

    this._loadModels()
    this._resolveAssociations()
  }

  static RESOLVABLE_ASSOCIATION_OPTIONS = ['joinTableModel']
  static ASSOCIATIONS = ['belongsTo', 'hasMany', 'hasOne', 'belongsToMany']
  static HOOKS = [
    'beforeBulkCreate', 'beforeBulkDestroy', 'beforeBulkUpdate',
    'beforeValidate', 'afterValidate', 'validationFailed',
    'beforeCreate', 'beforeDestroy', 'beforeUpdate', 'beforeSave', 'beforeUpsert',
    'afterCreate', 'afterDestroy', 'afterUpdate', 'afterSave', 'afterUpsert',
    'afterBulkCreate', 'afterBulkDestroy', 'afterBulkUpdate'
  ]

  /**
   * Autoloads the models from the models directory
   * @private
   */
  _loadModels () {
    const { modelsDirectory, models } = this._options

    if (!modelsDirectory && models) {
      models.forEach(Model => {
        this._loadModel(Model)
      })
    } else if (modelsDirectory) {
      /* eslint-disable camelcase */
      const req = typeof __non_webpack_require__ === 'undefined' ? require : __non_webpack_require__
      /* eslint-enable camelcase */

      if (!fs.existsSync(modelsDirectory)) {
        throw new Error(`Models directory not found: ${modelsDirectory}`)
      }

      const files = globule.find('**/*', {
        cwd: modelsDirectory,
        filter: f => {
          return fs.statSync(f).isFile() && this._options.modelsMatch.test(f)
        }
      })

      files.forEach((file) => {
        const modelPath = path.resolve(modelsDirectory, file)
        const Model = req(modelPath).default || req(modelPath)

        this._loadModel(Model)
      })
    }
  }

  /**
   * Defines the associations, resolves the table names to real models.
   * @private
   */
  _resolveAssociations () {
    Object.keys(this.models).forEach((modelName) => {
      const model = this.models[modelName]
      const associations = model._associations
      associations.forEach((association) => {
        const options = association.options

        // Turn specific option values into model references
        this.constructor.RESOLVABLE_ASSOCIATION_OPTIONS.forEach((relationOption) => {
          if (options.hasOwnProperty(relationOption)) {
            const modelName = options[relationOption]
            options[relationOption] = this.models[modelName]._model
          }
        })

        // Call the association method on the sequelize model
        if (!this.models[association.modelName]) {
          throw new Error(`Associated model missing for ${modelName}: ${association.modelName}`)
        }

        model._model[association.type](
          this.models[association.modelName]._model, association.options
        )
      })
    })
  }

  /**
   * Loads the given Model
   * @param  {Class} Model
   * @private
   */
  _loadModel (Model) {
    const map = {}
    const fields = {}
    const getters = {}
    const setters = {}
    const validators = {}
    const hooks = {}
    const indices = []
    const options = {}
    let model
    let modelName
    let modelOptions

    // Avoid that our helpers will be added as instance functions to the sequelize model
    Model._methodBlacklist = _.union(
      ['constructor', 'field', 'get', 'set', 'validates', '_methodBlacklist'],
      this.constructor.ASSOCIATIONS,
      this.constructor.HOOKS
    )

    // Attach the helpers that we will later call from the constructor
    this._attachFieldHelperToMap(Model, map, fields)
    this._attachGetHelperToMap(Model, map, getters)
    this._attachSetHelperToMap(Model, map, setters)
    this._attachValidatesHelperToMap(Model, map, validators)
    this._attachAssociationHelpersToMap(Model, map)
    this._attachHookHelpersToMap(Model, map, hooks)
    this._attachIndexHelperToMap(Model, map, indices)
    this._attachOptionsHelperToMap(Model, map, options)

    // Attach sequelize's data types to the map
    this._attachDataTypesToMap(map)

    // Call the model constructor so that our targets get filled with data
    model = new Model(map)

    // Define the sequelize model
    modelName = model.constructor.name
    modelOptions = _.extend({
      validate: validators,
      getterMethods: getters,
      setterMethods: setters,
      hooks
    }, options)
    model._model = this.sequelize.define(modelName, fields, modelOptions)

    // Copy instance and class methods to the model
    this._copyMethodsToModel(Model, model._model)

    // Attach the real sequelize models to the modelsAttacher. Since modelsAttacher defaults to
    // `global`, we will make the models globally available per default
    this._options.modelsAttacher[modelName] = model._model

    // Store our fake model
    this.models[modelName] = model
  }

  /**
   * Adds a `field` prototype method to map which will add a new field to the `target` object
   * @param  {Class} modelClass
   * @param  {Object} map
   * @param  {Object} target
   * @private
   */
  _attachFieldHelperToMap (modelClass, map, target) {
    map.field = (name, type, options = {}) => {
      options.type = type
      target[name] = options
    }
  }

  /**
   * Adds a `get` prototype method to map which will add a new getter
   * @param  {Class} modelClass
   * @param  {Object} map
   * @param  {Object} target
   * @private
   */
  _attachGetHelperToMap (modelClass, map, target) {
    const { getterPrefix } = this._options
    map.get = attributeName => {
      const capitalizedAttribute = _.upperFirst(attributeName)
      const methodName = getterPrefix + capitalizedAttribute
      target[attributeName] = modelClass.prototype[methodName]
      modelClass._methodBlacklist.push(attributeName)
    }
  }

  /**
   * Adds a `set` prototype method to map which will add a new setter
   * @param  {Class} modelClass
   * @param  {Object} map
   * @param  {Object} target
   * @private
   */
  _attachSetHelperToMap (modelClass, map, target) {
    const { setterPrefix } = this._options
    map.set = attributeName => {
      const capitalizedAttribute = _.upperFirst(attributeName)
      const methodName = setterPrefix + capitalizedAttribute

      target[attributeName] = modelClass.prototype[methodName]
      modelClass._methodBlacklist.push(attributeName)
    }
  }

  /**
   * Adds a `validates` prototype method to modelClass
   * which will add a new validator
   * @param  {Class} modelClass
   * @param  {Object} map
   * @param  {Object} target
   * @private
   */
  _attachValidatesHelperToMap (modelClass, map, target) {
    map.validates = methodName => {
      target[methodName] = modelClass.prototype[methodName]
      modelClass._methodBlacklist.push(methodName)
    }
  }

  /**
   * Adds prototype methods for all existing association types which will add a new association
   * @param  {Class} modelClass
   * @param  {Object} map
   * @private
   */
  _attachAssociationHelpersToMap (modelClass, map) {
    modelClass.prototype._associations = []
    this.constructor.ASSOCIATIONS.forEach(association => {
      map[association] = (modelName, options = {}) => {
        modelClass.prototype._associations.push({
          type: association,
          modelName,
          options
        })
      }
    })
  }

  /**
   * Adds prototype methods for all existing hooks which will add new hook methods
   * @param  {Class} modelClass
   * @param  {Object} map
   * @param  {Object} target
   * @private
   */
  _attachHookHelpersToMap (modelClass, map, target) {
    this.constructor.HOOKS.forEach(hook => {
      map[hook] = methodName => {
        if (!target[hook]) target[hook] = []

        target[hook].push(modelClass.prototype[methodName])
        modelClass._methodBlacklist.push(methodName)
      }
    })
  }

  /**
   * Adds a `index` prototype method to modelClass which will add a new index
   * @param  {Class} modelClass
   * @param  {Object} map
   * @param  {Object} target
   * @private
   */
  _attachIndexHelperToMap (modelClass, map, target) {
    map.index = (attributes, options) => {
      target.push({ attributes, options })
    }
  }

  /**
   * Adds a `options` prototype method to modelClass which will add options to the target
   * @param  {Class} modelClass
   * @param  {Object} map
   * @param  {Object} target
   * @private
   */
  _attachOptionsHelperToMap (modelClass, map, target) {
    map.options = options => {
      _.extend(target, options)
    }
  }

  /**
   * Copies the instance and class methods of the given `modelClass` to the given `modelInstance`
   * @param  {Class} modelClass
   * @param  {Object} modelInstance
   * @private
   */
  _copyMethodsToModel (modelClass, modelInstance) {
    // Copy prototypes
    Object.getOwnPropertyNames(modelClass.prototype)
      .filter(method => typeof modelClass.prototype[method] === 'function')
      .forEach(method => {
        if (!modelClass._methodBlacklist.includes(method)) {
          modelInstance.prototype[method] = modelClass.prototype[method]
        }
      })

    // Extract class methods
    Object.getOwnPropertyNames(modelClass)
      .filter(method => typeof modelClass[method] === 'function')
      .forEach(method => {
        if (!modelClass._methodBlacklist.includes(method)) {
          modelInstance[method] = modelClass[method]
        }
      })
  }

  /**
   * Copies sequelize's data types to the map
   * @param  {Object} map
   * @private
   */
  _attachDataTypesToMap (map) {
    for (const key in DataTypes) {
      map[key] = DataTypes[key]
    }
  }

  /**
   * Deletes model references and cleans up a little
   * @public
   */
  dispose () {
    Object.keys(this.models)
      .forEach(key => {
        delete this._options.modelsAttacher[key]
        delete this.models[key]
      })
  }
}
