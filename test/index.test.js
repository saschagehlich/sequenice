var should = require("should")
  , Sequelize = require("sequelize")
  , Sequenice = require("..")
  , sequelize, sequenice
  , models = {};

before(function (done) {
  sequelize = new Sequelize("sequenice_test", "root", "");
  sequenice = new Sequenice(sequelize, {
    modelsDirectory: __dirname + "/models",
    modelsAttacher: models,
    getterPrefix: "get",
    setterPrefix: "set"
  });
  sequelize.sync({ force: true }).success(function () {
    done()
  }).failure(function (err) {
    throw err[0][0];
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
        user.beforeCreateCalled.should.be.true;
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
});
