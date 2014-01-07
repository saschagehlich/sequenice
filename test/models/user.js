"use strict";
function User(m) {
  /**
   * Field declarations
   */
  m.field("name", m.STRING);
  m.field("isAdmin", m.BOOLEAN, { defaultValue: false });
  m.field("beforeCreateCalled", m.BOOLEAN, { defaultValue: false });

  /**
   * Associations
   */
  m.hasMany("Project");

  /**
   * Getters
   */
  m.get("price");
  m.get("priceInCents");

  /**
   * Setters
   */
  m.set("price");

  /**
   * Hooks
   */
  m.beforeCreate("myBeforeCreateMethod");

  /**
   * Validations
   */
  m.validates("myValidationMethod");

  /**
   * Indices
   */
  m.index(["id", "name"], { indexName: "IdName" });
  m.index(["name", "isAdmin"]);
}

User.classMethod = function() {};
User.prototype.instanceMethod = function() {};

User.prototype._getPrice = function() {
  return "$" + (this.getDataValue("priceInCents") / 100);
};

User.prototype._getPriceInCents = function() {
  return this.dataValues.priceInCents;
};

User.prototype._setPrice = function(value) {
  this.dataValues.priceInCents = value * 100;
};

User.prototype.myBeforeCreateMethod = function(user, callback) {
  user.beforeCreateCalled = true;
  callback();
};

User.prototype.myValidationMethod = function (callback) {
  callback();
};

module.exports = User;
