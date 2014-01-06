"use strict";
var should = require("should");
var Sequelize = require("sequelize");
var Sequenice = require("..");
var sequelize, sequenice;
var models = {};

before(function (done) {
  sequelize = new Sequelize("sequenice_test", "root");
  sequenice = new Sequenice(sequelize, {
    modelsDirectory: __dirname + "/models",
    modelsAttacher: models,
    getterPrefix: "get",
    setterPrefix: "set"
  });
  var chain = new Sequelize.Utils.QueryChainer();

  chain.add(sequelize.dropAllSchemas());
  chain.add(sequelize.sync());

  chain.run().success(function () {
    done();
  }).failure(function (err) {
    throw err;
  });
});

describe("sequenice example", function () {
  /**
   * Field definitions
   */
  describe("field definitions", function () {
    it("creates `User` and `Project` models and attaches them to `models`", function () {
      should.exist(models.User);
      should.exist(models.Project);
    });

    it("creates a `name` field", function (done) {
      models.User.create({ name: "A Name" }).success(function (user) {
        should.exist(user.name);
        done();
      });
    });

    it("creates a `isAdmin` field with a default value", function (done) {
      models.User.create({ name: "A Name" }).success(function (user) {
        user.isAdmin.should.equal(false);
        done();
      });
    });
  });

  /**
   * Class / instance methods
   */
  describe("class methods", function () {
    it("turn into sequelize class methods", function (done) {
      should.exist(models.User.classMethod);
      done();
    });
  });

  describe("instance methods", function () {
    it("turn into sequelize instance methods", function (done) {
      models.User.create({ name: "Some name" }).success(function (user) {
        should.exist(user.instanceMethod);
        done();
      });
    });
  });

  /**
   * Associations
   */
  describe("associations definitions", function () {
    it("creates a hasMany relation from `User` to `Project`", function (done) {
      models.User.create({ name: "A Name" }).success(function (user) {
        models.Project.create({ name: "Project name" }).success(function (project) {
          user.setProjects([project]).success(function () {
            done();
          });
        });
      });
    });

    it("creates a belongsTo relation from `Project` to `User`", function (done) {
      models.Project.create({ name: "Project name" }).success(function (project) {
        models.User.create({ name: "A Name" }).success(function (user) {
          project.setUser(user).success(function () {
            done();
          });
        });
      });
    });
  });

  /**
   * Hooks
   */
  describe("hooks", function () {
    it("defines a `beforeCreate` hook", function (done) {
      models.User.create().success(function (user) {
        user.beforeCreateCalled.should.equal(true);
        done();
      });
    });
  });

  /**
   * Getters / setters
   */
  it("defines getters and setters", function (done) {
    models.User.build({ price: 20 }).priceInCents.should.equal(20 * 100);
    models.User.build({ priceInCents: 30 * 100 }).price.should.equal("$" + 30);

    done();
  });

  /**
   * Indices
   */
  it("creates indices", function (done) {
    sequelize.queryInterface.showIndex("Users").success(function (indices) {
      indices.length.should.equal(3);

      indices[1].name.should.equal("IdName");
      indices[2].name.should.equal("NameIsAdmin");

      done();
    });
  });
});
