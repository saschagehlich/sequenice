"use strict";
var sequelize = require("sequelize");
var Utils = sequelize.Utils;

function IndicesSyncer(sequelize, model, indices) {
  this.sequelize = sequelize;
  this.model = model;
  this.indices = indices;
}

/**
 * Checks whether syncing is necessary, then starts the
 * syncing process
 * @return {CustomEventEmitter}
 * @public
 */
IndicesSyncer.prototype.sync = function() {
  var self = this;

  // No indices to sync, just pretend we're fine
  if (this.indices.length === 0) {
    return new Utils.CustomEventEmitter(function (emitter) {
      emitter.emit("success", self.model);
    }).run();
  }

  // Fetch the current indices
  return new Utils.CustomEventEmitter(function (emitter) {
    self._fetchIndices(emitter);
  }).run();
};

/**
 * Fetches the currently existing indices, then syncs them
 * @param  {CustomEventEmitter} emitter
 * @private
 */
IndicesSyncer.prototype._fetchIndices = function(emitter) {
  var queryInterface = this.sequelize.queryInterface;
  var self = this;

  queryInterface.showIndex(this.model.tableName)
    .success(function (existingIndices) {
      self.existingIndices = existingIndices;

      self._syncIndices(emitter);
    })
    .error(function (e) {
      emitter.emit("error", e);
    });
};

/**
 * Final step - sync the indices and pass the result of our
 * chain to the emitter
 * @param  {CustomEventEmitter} emitter
 * @private
 */
IndicesSyncer.prototype._syncIndices = function(emitter) {
  var chainer = new Utils.QueryChainer();
  var queryInterface = this.sequelize.queryInterface;

  for (var i = 0, len = this.indices.length; i < len; i++) {
    var index = this.indices[i];
    var indexName;

    // Build the index name
    // @TODO
    //   Move the index name generation to sequelize maybe?
    if (index.options && index.options.indexName) {
      indexName = index.options.indexName;
    } else {
      indexName = Utils._.underscored(this.model.tableName + "_" + index.attributes.join("_"));
    }

    // Does the index already exist?
    var indexExists =
      this.existingIndices
        .filter(function (existingIndex) {
          return existingIndex.name === indexName;
        }).length > 0;

    if (!indexExists) {
      chainer.add(queryInterface.addIndex(this.model.tableName, index.attributes, index.options));
    }
  }

  chainer
    .run()
    .proxy(emitter);
};

module.exports = IndicesSyncer;
