# Sequenice [![Build Status](https://travis-ci.org/saschagehlich/sequenice.png?branch=master)](https://travis-ci.org/saschagehlich/sequenice)

`sequenice` is a model wrapper for `sequelize` which gives you a better and cleaner way to define models. It is based on real JavaScript objects / classes that are automatically turned into sequelize models.

## Features

* Auto-loads a model directory
* Attaches helpers to your models
* Turns your `sequenice` models into `sequelize` models

## Initialization

### 1. Models folder

`sequenice` requires a models folder. Create it anywhere inside your project.

### 2. Initialize `sequelize`

Initialize `sequelize` the way you are used to, e.g. like this:

```js
var Sequelize = require("sequelize")
  , database = new Sequelize("my_database", "my_user", "my_password");
```

### 3. Initialize `sequenice`

Since `sequenice` is just a model wrapper for `sequelize`, you will have to initialize a new `sequenice` instance and pass your `sequelize` instance as well as some options to it:

```js
var Sequenice = require("sequenice")
  , new Sequenice(database, {
    modelsDirectory: __dirname + "/models", // The path to your models folder
    modelsAttacher: global, // The object you want to attach your models to
    getterPrefix: "get", // See "Defining models"
    setterPrefix: "set", // See "Defining models"
  });
```

## Defining models

Inside your models folder you create a file for each model which will contain a JavaScript class. Class methods of this class will become class methods of your model, instance methods will become instance methods.

Inside the constructor you have access to a couple of helpers which will define your model.

Here's an example:

```js
function Product(s) {
  // `s` points to the Sequelize module

  // Field definitions
  this.field("name", s.STRING);
  this.field("isPublished", s.BOOLEAN, { defaultValue: false });

  // Associations
  // hasOne, belongsTo, hasMany
  // Pass the associated model name as a string.
  this.hasMany("Variants");
  this.belongsTo("Category");

  // Hooks
  // beforeValidate, beforeCreate, ...
  // Pass the method name as a string.
  this.beforeCreate("publish");

  // Getters / Setters
  // Define getterMethods and setterMethods. Pass the variable name
  // as a string.
  // If your getterPrefix is "get" and the variable name is "price",
  // sequenice will try to call the "getPrice" method of your class.
  this.get("price");
  this.set("price");

  // Validations
  // Pass the validation method name as a string.
  this.validates("cheap");

  // Indices
  this.index(["name", "isPublished"], { indexName: "NameIsPublished" });

  // Model options
  this.options({
    timestamps: false
  });
}

// This will be called before a Product is created
Product.prototype.publish = function (product, callback) {
  product.published = true;
  callback();
}

// Gets called when `myProduct.price` is accessed
Product.prototype.getPrice = function () {
  return "$ " + (this.dataValues.priceAsCents / 100).toFixed(2);
};

// Gets called when `myProduct.price` is set`
Product.prototype.setPrice = function (price) {
  this.dataValues.priceAsCents = price / 100;
};

// Validation
Product.prototype.cheap = function () {
  if (this.dataValues.priceAsCents > 500) {
    throw new Error("Damn, that shit's expensive!");
  }
};
```

Since we set `modelsAttacher` to `global`, we can now access our model via `global.User` or just `User`.


## License

The MIT License (MIT)

Copyright (c) 2013 Sascha Gehlich and FILSH Media GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
