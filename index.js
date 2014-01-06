"use strict";
var path = require("path");
var fs = require("fs");
var _ = require("underscore");
var Sequelize = require("sequelize");
var Utils = Sequelize.Utils;
_.str = require("underscore.string");
var IndicesSyncer = require("./lib/indices-syncer");

function Sequenice(sequelize, options) {
  if (!sequelize) throw new Error("sequenice needs an instance of sequelize");
  this.sequelize = sequelize;
  this.models = {};

  var defaultModelsDirectory = path.resolve(
    path.dirname(module.parent.id),
    "models"
  );

  this.options = {
    modelsDirectory: options.modelsDirectory || defaultModelsDirectory,
    modelsAttacher: options.modelsAttacher || global,
    getterPrefix: options.getterPrefix || "get",
    setterPrefix: options.setterPrefix || "set"
  };

  this._loadModels();
  this._resolveAssociations();
}

/**
 * Available sequelize keywords
 * @type {Array}
 */
Sequenice.RESOLVABLE_ASSOCIATION_OPTIONS = ["joinTableModel"];
Sequenice.ASSOCIATIONS = ["belongsTo", "hasMany", "hasOne"];
Sequenice.HOOKS = [
  "beforeValidate",
  "afterValidate",
  "beforeBulkCreate",
  "beforeCreate", "afterCreate",
  "afterBulkCreate"
];

/**
 * Auto-loads the models from the modelsDirectory
 * @private
 */
Sequenice.prototype._loadModels = function() {
  var self = this;
  if (!fs.existsSync(this.options.modelsDirectory))
    throw new Error("Models directory not found: " + this.options.modelsDirectory);

  // Read the models directory
  var files = fs.readdirSync(this.options.modelsDirectory);

  // Iterate over the model files
  files.forEach(function (file) {
    var modelPath = path.resolve(self.options.modelsDirectory, file);
    self._loadModel(modelPath);
  });
};

/**
 * Defines the associations, resolves the table names
 * to real models.
 * @private
 */
Sequenice.prototype._resolveAssociations = function() {
  var self = this;
  Object.keys(this.models).forEach(function (modelName) {
    var model = self.models[modelName];
    var associations = model._associations;
    associations.forEach(function (association) {
      var options = association.options;

      // Turn specific option values into model references
      Sequenice.RESOLVABLE_ASSOCIATION_OPTIONS.forEach(function (relationOption) {
        if (options.hasOwnProperty(relationOption)) {
          var modelName = options[relationOption];
          options[relationOption] = self.models[modelName]._model;
        }
      });

      // Call the association method on the sequelize model
      model._model[association.type](
        self.models[association.modelName]._model, association.options
      );
    });
  });
};

/**
 * Loads a model from the given modelPath
 * @param  {String} modelPath
 * @private
 */
Sequenice.prototype._loadModel = function(modelPath) {
  var Model = require(modelPath);
  var fields = {};
  var getters = {};
  var setters = {};
  var validators = {};
  var hooks = {};
  var indices = [];
  var instanceMethods = {};
  var classMethods = {};
  var options = {};
  var model, modelName, modelOptions;

  // Avoid that our helpers will be added as
  // instance functions to the sequelize model
  Model._methodBlacklist = _.union(
    ["field", "get", "set", "validates", "_methodBlacklist"],
    Sequenice.ASSOCIATIONS,
    Sequenice.HOOKS
  );

  // Attach the helpers that we will later call from
  // the constructor
  this._attachFieldHelperToModel(Model, fields);
  this._attachGetHelperToModel(Model, getters);
  this._attachSetHelperToModel(Model, setters);
  this._attachValidatesHelperToModel(Model, validators);
  this._attachAssociationHelpersToModel(Model);
  this._attachHookHelpersToModel(Model, hooks);
  this._attachIndexHelperToModel(Model, indices);
  this._attachOptionsHelperToModel(Model, options);
  this._extractMethodsFromModel(Model, instanceMethods, classMethods);

  // Call the model constructor so that our
  // targets get filled with data
  model = new Model(Sequelize);

  // Define the sequelize model
  modelName = model.constructor.name;
  modelOptions = _.extend({
    instanceMethods: instanceMethods,
    classMethods: classMethods,
    validate: validators,
    getterMethods: getters,
    setterMethods: setters,
    hooks: hooks
  }, options);
  model._model = this.sequelize.define(modelName, fields, modelOptions);

  // Override the sync method so that it automatically
  // adds the given indices
  this._overrideSyncWithIndices(model._model, indices);

  // Attach the real sequelize models to the modelsAttacher.
  // Since modelsAttacher defaults to `global`, we will make
  // the models globally available per default
  this.options.modelsAttacher[modelName] = model._model;

  // Store our fake model
  this.models[modelName] = model;
};

/**
 * Adds a `field` prototype method to modelClass
 * which will add a new field to the `target` object
 * @param  {Class} modelClass
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachFieldHelperToModel = function(modelClass, target) {
  modelClass.prototype.field = function (name, type, options) {
    var opt = options || {};
    opt.type = type;
    target[name] = opt;
  };
};

/**
 * Adds a `get` prototype method to modelClass
 * which will add a new getter
 * @param  {Class} modelClass
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachGetHelperToModel = function(modelClass, target) {
  var self = this;
  modelClass.prototype.get = function (attributeName) {
    var capitalizedAttribute = _.str.capitalize(attributeName);
    var methodName = self.options.getterPrefix + capitalizedAttribute;

    target[attributeName] = modelClass.prototype[methodName];

    modelClass._methodBlacklist.push(attributeName);
  };
};

/**
 * Adds a `set` prototype method to modelClass
 * which will add a new setter
 * @param  {Class} modelClass
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachSetHelperToModel = function(modelClass, target) {
  var self = this;
  modelClass.prototype.set = function (attributeName) {
    var capitalizedAttribute = _.str.capitalize(attributeName);
    var methodName = self.options.setterPrefix + capitalizedAttribute;

    target[attributeName] = modelClass.prototype[methodName];

    modelClass._methodBlacklist.push(attributeName);
  };
};

/**
 * Adds a `validates` prototype method to modelClass
 * which will add a new validator
 * @param  {Class} modelClass
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachValidatesHelperToModel = function(modelClass, target) {
  modelClass.prototype.validates = function(methodName) {
    target[methodName] = modelClass.prototype[methodName];
    modelClass._methodBlacklist.push(methodName);
  };
};

/**
 * Adds prototype methods for all existing association
 * types which will add a new association
 * @param  {Class} modelClass
 * @private
 */
Sequenice.prototype._attachAssociationHelpersToModel = function(modelClass) {
  modelClass.prototype._associations = [];
  Sequenice.ASSOCIATIONS.forEach(function (association) {
    modelClass.prototype[association] = function (modelName, options) {
      modelClass.prototype._associations.push({
        type: association,
        modelName: modelName,
        options: options || {}
      });
    };
  });
};

/**
 * Adds prototype methods for all existing hooks
 * which will add new hook methods
 * @param  {Class} modelClass
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachHookHelpersToModel = function(modelClass, target) {
  Sequenice.HOOKS.forEach(function (hook) {
    modelClass.prototype[hook] = function (methodName) {
      if (!target[hook]) target[hook] = [];

      target[hook].push(modelClass.prototype[methodName]);
      modelClass._methodBlacklist.push(methodName);
    };
  });
};

/**
 * Adds a `index` prototype method to modelClass
 * which will add a new index
 * @param  {Class} modelClass
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachIndexHelperToModel = function(modelClass, target) {
  modelClass.prototype.index = function (attributes, options) {
    target.push({ attributes: attributes, options: options });
  };
};

/**
 * Adds a `options` prototype method to modelClass
 * which will add options to the target
 * @param  {Class} modelClass
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachOptionsHelperToModel = function(modelClass, target) {
  modelClass.prototype.options = function (options) {
    _.extend(target, options);
  };
};

/**
 * Extracts instance methods and class methods from the given
 * model class, excluding all methods in `modelClass._methodBlacklist`
 * and adds them to `instanceTarget` and `classTarget`
 * @param  {Class} modelClass
 * @param  {Object} instanceTarget
 * @param  {Object} classTarget
 * @private
 */
Sequenice.prototype._extractMethodsFromModel = function(modelClass, instanceTarget, classTarget) {
  // Extract instance methods
  Object.keys(modelClass.prototype).forEach(function (method) {
    if(modelClass._methodBlacklist.indexOf(method) === -1) {
      instanceTarget[method] = modelClass.prototype[method];
    }
  });

  // Extract class methods
  Object.keys(modelClass).forEach(function (method) {
    if(modelClass._methodBlacklist.indexOf(method) === -1) {
      classTarget[method] = modelClass[method];
    }
  });
};

/**
 * Overrides model.sync() to add incides after the syncing
 * has been done
 * @param  {Model} model
 * @param  {Array} indices
 * @private
 */
Sequenice.prototype._overrideSyncWithIndices = function(model, indices) {
  var sync = model.sync;
  var sequelize = this.sequelize;

  // Override syncing method so that it calls
  // addIndices() afterwards
  model.sync = function () {
    var self = this;
    return new Utils.CustomEventEmitter(function(emitter) {
      sync.apply(self, arguments)
        .success(function (m) {

          // Sequelize's syncing worked, run the index syncing mechanism
          var indicesSyncer = new IndicesSyncer(sequelize, m, indices);
          indicesSyncer
            .sync()
            .proxy(emitter);

        })
        .error(function (e) {
          emitter.emit("error", e);
        });
    }).run();
  };
};

module.exports = Sequenice;
