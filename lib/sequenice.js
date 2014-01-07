"use strict";
var Sequelize = require("sequelize");
var DataTypes = require("sequelize/lib/data-types");
var Utils = Sequelize.Utils;

var path = require("path");
var globule = require("globule");
var fs = require("fs");
var _ = require("underscore");
var _str = require("underscore.string");

var IndicesSyncer = require("./indices-syncer");

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
    modelsMatch: options.modelsMatch || /\.[js|coffee]/i,
    getterPrefix: options.getterPrefix || "_get",
    setterPrefix: options.setterPrefix || "_set"
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
 * Deletes model references and cleans up a little
 * @public
 */
Sequenice.prototype.dispose = function() {
  // Delete model references from modelsAttacher
  var self = this;
  Object.keys(this.models).forEach(function (key) {
    delete self.options.modelsAttacher[key];
    delete self.models[key];
  });
};

/**
 * Auto-loads the models from the modelsDirectory
 * @private
 */
Sequenice.prototype._loadModels = function() {
  var self = this;
  var match = this.options.modelsMatch;
  var files;

  if (!fs.existsSync(this.options.modelsDirectory))
    throw new Error("Models directory not found: " + this.options.modelsDirectory);

  if (typeof match === "string") {
    files = globule.find(match, {
      cwd: this.options.modelsDirectory
    });
  } else if (match instanceof RegExp) {
    files = globule.find("**/*", {
      cwd: this.options.modelsDirectory,
      filter: function (f) {
        return !!match.test(f);
      }
    });
  } else if (match instanceof Function) {
    files = globule.find("**/*", {
      cwd: this.options.modelsDirectory,
      filter: match
    });
  }

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
      if (!self.models[association.modelName]) {
        throw new Error("Associated model missing for " + modelName + ": " + association.modelName);
      }

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
  var map = {};
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
  this._attachFieldHelperToMap(Model, map, fields);
  this._attachGetHelperToMap(Model, map, getters);
  this._attachSetHelperToMap(Model, map, setters);
  this._attachValidatesHelperToMap(Model, map, validators);
  this._attachAssociationHelpersToMap(Model, map);
  this._attachHookHelpersToMap(Model, map, hooks);
  this._attachIndexHelperToMap(Model, map, indices);
  this._attachOptionsHelperToMap(Model, map, options);

  // Extract instance and class methods from the model
  this._extractMethodsFromModel(Model, instanceMethods, classMethods);

  // Attach sequelize's data types to the map
  this._attachDataTypesToMap(map);

  // Call the model constructor so that our
  // targets get filled with data
  model = new Model(map);

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
 * Adds a `field` prototype method to map
 * which will add a new field to the `target` object
 * @param  {Class} modelClass
 * @param  {Object} map
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachFieldHelperToMap = function(modelClass, map, target) {
  map.field = function (name, type, options) {
    var opt = options || {};
    opt.type = type;
    target[name] = opt;
  };
};

/**
 * Adds a `get` prototype method to map
 * which will add a new getter
 * @param  {Class} modelClass
 * @param  {Object} map
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachGetHelperToMap = function(modelClass, map, target) {
  var self = this;
  map.get = function (attributeName) {
    var capitalizedAttribute = _str.capitalize(attributeName);
    var methodName = self.options.getterPrefix + capitalizedAttribute;

    target[attributeName] = modelClass.prototype[methodName];

    modelClass._methodBlacklist.push(attributeName);
  };
};

/**
 * Adds a `set` prototype method to map
 * which will add a new setter
 * @param  {Class} modelClass
 * @param  {Object} map
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachSetHelperToMap = function(modelClass, map, target) {
  var self = this;
  map.set = function (attributeName) {
    var capitalizedAttribute = _str.capitalize(attributeName);
    var methodName = self.options.setterPrefix + capitalizedAttribute;

    target[attributeName] = modelClass.prototype[methodName];

    modelClass._methodBlacklist.push(attributeName);
  };
};

/**
 * Adds a `validates` prototype method to modelClass
 * which will add a new validator
 * @param  {Class} modelClass
 * @param  {Object} map
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachValidatesHelperToMap = function(modelClass, map, target) {
  map.validates = function(methodName) {
    target[methodName] = modelClass.prototype[methodName];
    modelClass._methodBlacklist.push(methodName);
  };
};

/**
 * Adds prototype methods for all existing association
 * types which will add a new association
 * @param  {Class} modelClass
 * @param  {Object} map
 * @private
 */
Sequenice.prototype._attachAssociationHelpersToMap = function(modelClass, map) {
  modelClass.prototype._associations = [];
  Sequenice.ASSOCIATIONS.forEach(function (association) {
    map[association] = function (modelName, options) {
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
 * @param  {Object} map
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachHookHelpersToMap = function(modelClass, map, target) {
  Sequenice.HOOKS.forEach(function (hook) {
    map[hook] = function (methodName) {
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
 * @param  {Object} map
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachIndexHelperToMap = function(modelClass, map, target) {
  map.index = function (attributes, options) {
    target.push({ attributes: attributes, options: options });
  };
};

/**
 * Adds a `options` prototype method to modelClass
 * which will add options to the target
 * @param  {Class} modelClass
 * @param  {Object} map
 * @param  {Object} target
 * @private
 */
Sequenice.prototype._attachOptionsHelperToMap = function(modelClass, map, target) {
  map.options = function (options) {
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

/**
 * Copies sequelize's data types to the map
 * @param  {Object} map
 * @private
 */
Sequenice.prototype._attachDataTypesToMap = function(map) {
  for (var key in DataTypes) {
    map[key] = DataTypes[key];
  }
};

module.exports = Sequenice;
