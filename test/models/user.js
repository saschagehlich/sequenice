"use strict";
function User(s) {
  /**
   * Field declarations
   */
  this.field("name", s.STRING);
  this.field("isAdmin", s.BOOLEAN, { defaultValue: false });
  this.field("beforeCreateCalled", s.BOOLEAN, { defaultValue: false });

  /**
   * Associations
   */
  this.hasMany("Project");

  /**
   * Getters
   */
  this.get("price");
  this.get("priceInCents");

  /**
   * Setters
   */
  this.set("price");

  /**
   * Hooks
   */
  this.beforeCreate("myBeforeCreateMethod");

  /**
   * Validations
   */
  this.validates("myValidationMethod");

  /**
   * Indices
   */
  this.index(["id", "name"], { indexName: "IdName" });
  this.index(["name", "isAdmin"], { indexName: "NameIsAdmin" });
}

User.classMethod = function() {};
User.prototype.instanceMethod = function() {};

User.prototype.getPrice = function() {
  return "$" + (this.getDataValue("priceInCents") / 100);
};

User.prototype.getPriceInCents = function() {
  return this.dataValues.priceInCents;
};

User.prototype.setPrice = function(value) {
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
