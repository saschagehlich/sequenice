module.exports =
/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// identity function for calling harmony imports with the correct context
/******/ 	__webpack_require__.i = function(value) { return value; };
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, {
/******/ 				configurable: false,
/******/ 				enumerable: true,
/******/ 				get: getter
/******/ 			});
/******/ 		}
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = 5);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ (function(module, exports) {

module.exports = require("fs");

/***/ }),
/* 1 */
/***/ (function(module, exports) {

module.exports = require("globule");

/***/ }),
/* 2 */
/***/ (function(module, exports) {

module.exports = require("lodash");

/***/ }),
/* 3 */
/***/ (function(module, exports) {

module.exports = require("path");

/***/ }),
/* 4 */
/***/ (function(module, exports) {

module.exports = require("sequelize/lib/data-types");

/***/ }),
/* 5 */
/***/ (function(module, exports, __webpack_require__) {

"use strict";


Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }(); /* global __non_webpack_require__ */


var _path = __webpack_require__(3);

var _path2 = _interopRequireDefault(_path);

var _fs = __webpack_require__(0);

var _fs2 = _interopRequireDefault(_fs);

var _lodash = __webpack_require__(2);

var _lodash2 = _interopRequireDefault(_lodash);

var _globule = __webpack_require__(1);

var _globule2 = _interopRequireDefault(_globule);

var _dataTypes = __webpack_require__(4);

var _dataTypes2 = _interopRequireDefault(_dataTypes);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var Sequenize = function () {
  function Sequenize(sequelize, options) {
    _classCallCheck(this, Sequenize);

    this.sequelize = sequelize;
    this.models = {};

    if (!options.modelsDirectory && !options.models) {
      throw new Error('Sequenice: No `modelsDirectory` or `models` given.');
    }

    this._options = _lodash2.default.clone(options);
    _lodash2.default.defaults(this._options, {
      modelsDirectory: null,
      modelsAttacher: global,
      getterPrefix: '_get',
      setterPrefix: '_set'
    });

    this._loadModels();
    this._resolveAssociations();
  }

  _createClass(Sequenize, [{
    key: '_loadModels',


    /**
     * Autoloads the models from the models directory
     * @private
     */
    value: function _loadModels() {
      var _this = this;

      var _options = this._options,
          modelsDirectory = _options.modelsDirectory,
          models = _options.models;


      if (!modelsDirectory && models) {
        models.forEach(function (Model) {
          _this._loadModel(Model);
        });
      } else if (modelsDirectory) {
        /* eslint-disable camelcase */
        var req =  false ? require : require;
        /* eslint-enable camelcase */

        if (!_fs2.default.existsSync(modelsDirectory)) {
          throw new Error('Models directory not found: ' + modelsDirectory);
        }

        var files = _globule2.default.find('**/*', {
          cwd: modelsDirectory,
          filter: 'isFile'
        });

        files.forEach(function (file) {
          var modelPath = _path2.default.resolve(modelsDirectory, file);
          var Model = req(modelPath).default || req(modelPath);

          _this._loadModel(Model);
        });
      }
    }

    /**
     * Defines the associations, resolves the table names to real models.
     * @private
     */

  }, {
    key: '_resolveAssociations',
    value: function _resolveAssociations() {
      var _this2 = this;

      Object.keys(this.models).forEach(function (modelName) {
        var model = _this2.models[modelName];
        var associations = model._associations;
        associations.forEach(function (association) {
          var options = association.options;

          // Turn specific option values into model references
          _this2.constructor.RESOLVABLE_ASSOCIATION_OPTIONS.forEach(function (relationOption) {
            if (options.hasOwnProperty(relationOption)) {
              var _modelName = options[relationOption];
              options[relationOption] = _this2.models[_modelName]._model;
            }
          });

          // Call the association method on the sequelize model
          if (!_this2.models[association.modelName]) {
            throw new Error('Associated model missing for ' + modelName + ': ' + association.modelName);
          }

          model._model[association.type](_this2.models[association.modelName]._model, association.options);
        });
      });
    }

    /**
     * Loads the given Model
     * @param  {Class} Model
     * @private
     */

  }, {
    key: '_loadModel',
    value: function _loadModel(Model) {
      var map = {};
      var fields = {};
      var getters = {};
      var setters = {};
      var validators = {};
      var hooks = {};
      var indices = [];
      var options = {};
      var model = void 0;
      var modelName = void 0;
      var modelOptions = void 0;

      // Avoid that our helpers will be added as instance functions to the sequelize model
      Model._methodBlacklist = _lodash2.default.union(['constructor', 'field', 'get', 'set', 'validates', '_methodBlacklist'], this.constructor.ASSOCIATIONS, this.constructor.HOOKS);

      // Attach the helpers that we will later call from the constructor
      this._attachFieldHelperToMap(Model, map, fields);
      this._attachGetHelperToMap(Model, map, getters);
      this._attachSetHelperToMap(Model, map, setters);
      this._attachValidatesHelperToMap(Model, map, validators);
      this._attachAssociationHelpersToMap(Model, map);
      this._attachHookHelpersToMap(Model, map, hooks);
      this._attachIndexHelperToMap(Model, map, indices);
      this._attachOptionsHelperToMap(Model, map, options);

      // Attach sequelize's data types to the map
      this._attachDataTypesToMap(map);

      // Call the model constructor so that our targets get filled with data
      model = new Model(map);

      // Define the sequelize model
      modelName = model.constructor.name;
      modelOptions = _lodash2.default.extend({
        validate: validators,
        getterMethods: getters,
        setterMethods: setters,
        hooks: hooks
      }, options);
      model._model = this.sequelize.define(modelName, fields, modelOptions);

      // Copy instance and class methods to the model
      this._copyMethodsToModel(Model, model._model);

      // Attach the real sequelize models to the modelsAttacher. Since modelsAttacher defaults to
      // `global`, we will make the models globally available per default
      this._options.modelsAttacher[modelName] = model._model;

      // Store our fake model
      this.models[modelName] = model;
    }

    /**
     * Adds a `field` prototype method to map which will add a new field to the `target` object
     * @param  {Class} modelClass
     * @param  {Object} map
     * @param  {Object} target
     * @private
     */

  }, {
    key: '_attachFieldHelperToMap',
    value: function _attachFieldHelperToMap(modelClass, map, target) {
      map.field = function (name, type) {
        var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

        options.type = type;
        target[name] = options;
      };
    }

    /**
     * Adds a `get` prototype method to map which will add a new getter
     * @param  {Class} modelClass
     * @param  {Object} map
     * @param  {Object} target
     * @private
     */

  }, {
    key: '_attachGetHelperToMap',
    value: function _attachGetHelperToMap(modelClass, map, target) {
      var getterPrefix = this._options.getterPrefix;

      map.get = function (attributeName) {
        var capitalizedAttribute = _lodash2.default.upperFirst(attributeName);
        var methodName = getterPrefix + capitalizedAttribute;
        target[attributeName] = modelClass.prototype[methodName];
        modelClass._methodBlacklist.push(attributeName);
      };
    }

    /**
     * Adds a `set` prototype method to map which will add a new setter
     * @param  {Class} modelClass
     * @param  {Object} map
     * @param  {Object} target
     * @private
     */

  }, {
    key: '_attachSetHelperToMap',
    value: function _attachSetHelperToMap(modelClass, map, target) {
      var setterPrefix = this._options.setterPrefix;

      map.set = function (attributeName) {
        var capitalizedAttribute = _lodash2.default.upperFirst(attributeName);
        var methodName = setterPrefix + capitalizedAttribute;

        target[attributeName] = modelClass.prototype[methodName];
        modelClass._methodBlacklist.push(attributeName);
      };
    }

    /**
     * Adds a `validates` prototype method to modelClass
     * which will add a new validator
     * @param  {Class} modelClass
     * @param  {Object} map
     * @param  {Object} target
     * @private
     */

  }, {
    key: '_attachValidatesHelperToMap',
    value: function _attachValidatesHelperToMap(modelClass, map, target) {
      map.validates = function (methodName) {
        target[methodName] = modelClass.prototype[methodName];
        modelClass._methodBlacklist.push(methodName);
      };
    }

    /**
     * Adds prototype methods for all existing association types which will add a new association
     * @param  {Class} modelClass
     * @param  {Object} map
     * @private
     */

  }, {
    key: '_attachAssociationHelpersToMap',
    value: function _attachAssociationHelpersToMap(modelClass, map) {
      modelClass.prototype._associations = [];
      this.constructor.ASSOCIATIONS.forEach(function (association) {
        map[association] = function (modelName) {
          var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

          modelClass.prototype._associations.push({
            type: association,
            modelName: modelName,
            options: options
          });
        };
      });
    }

    /**
     * Adds prototype methods for all existing hooks which will add new hook methods
     * @param  {Class} modelClass
     * @param  {Object} map
     * @param  {Object} target
     * @private
     */

  }, {
    key: '_attachHookHelpersToMap',
    value: function _attachHookHelpersToMap(modelClass, map, target) {
      this.constructor.HOOKS.forEach(function (hook) {
        map[hook] = function (methodName) {
          if (!target[hook]) target[hook] = [];

          target[hook].push(modelClass.prototype[methodName]);
          modelClass._methodBlacklist.push(methodName);
        };
      });
    }

    /**
     * Adds a `index` prototype method to modelClass which will add a new index
     * @param  {Class} modelClass
     * @param  {Object} map
     * @param  {Object} target
     * @private
     */

  }, {
    key: '_attachIndexHelperToMap',
    value: function _attachIndexHelperToMap(modelClass, map, target) {
      map.index = function (attributes, options) {
        target.push({ attributes: attributes, options: options });
      };
    }

    /**
     * Adds a `options` prototype method to modelClass which will add options to the target
     * @param  {Class} modelClass
     * @param  {Object} map
     * @param  {Object} target
     * @private
     */

  }, {
    key: '_attachOptionsHelperToMap',
    value: function _attachOptionsHelperToMap(modelClass, map, target) {
      map.options = function (options) {
        _lodash2.default.extend(target, options);
      };
    }

    /**
     * Copies the instance and class methods of the given `modelClass` to the given `modelInstance`
     * @param  {Class} modelClass
     * @param  {Object} modelInstance
     * @private
     */

  }, {
    key: '_copyMethodsToModel',
    value: function _copyMethodsToModel(modelClass, modelInstance) {
      // Copy prototypes
      Object.getOwnPropertyNames(modelClass.prototype).filter(function (method) {
        return typeof modelClass.prototype[method] === 'function';
      }).forEach(function (method) {
        if (!modelClass._methodBlacklist.includes(method)) {
          modelInstance.prototype[method] = modelClass.prototype[method];
        }
      });

      // Extract class methods
      Object.getOwnPropertyNames(modelClass).filter(function (method) {
        return typeof modelClass[method] === 'function';
      }).forEach(function (method) {
        if (!modelClass._methodBlacklist.includes(method)) {
          modelInstance[method] = modelClass[method];
        }
      });
    }

    /**
     * Copies sequelize's data types to the map
     * @param  {Object} map
     * @private
     */

  }, {
    key: '_attachDataTypesToMap',
    value: function _attachDataTypesToMap(map) {
      for (var key in _dataTypes2.default) {
        map[key] = _dataTypes2.default[key];
      }
    }

    /**
     * Deletes model references and cleans up a little
     * @public
     */

  }, {
    key: 'dispose',
    value: function dispose() {
      var _this3 = this;

      Object.keys(this.models).forEach(function (key) {
        delete _this3._options.modelsAttacher[key];
        delete _this3.models[key];
      });
    }
  }]);

  return Sequenize;
}();

Sequenize.RESOLVABLE_ASSOCIATION_OPTIONS = ['joinTableModel'];
Sequenize.ASSOCIATIONS = ['belongsTo', 'hasMany', 'hasOne', 'belongsToMany'];
Sequenize.HOOKS = ['beforeBulkCreate', 'beforeBulkDestroy', 'beforeBulkUpdate', 'beforeValidate', 'afterValidate', 'validationFailed', 'beforeCreate', 'beforeDestroy', 'beforeUpdate', 'beforeSave', 'beforeUpsert', 'afterCreate', 'afterDestroy', 'afterUpdate', 'afterSave', 'afterUpsert', 'afterBulkCreate', 'afterBulkDestroy', 'afterBulkUpdate'];
exports.default = Sequenize;

/***/ })
/******/ ]);