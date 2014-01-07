0.0.6 (Jan 7 2014)
==================

* Models now take a model as the constructor parameter instead of the sequelize model. All helpers will be called on that map.
* Added error message for missing association models
* Added a `modelMatch` option (can be a string, a regular expression or a function)

0.0.5 (Jan 6 2014)
==================

* `.options()` method for model options

0.0.4 (Jan 6 2014)
==================

* Only add indices if they don't exist already (syncing mechanism)

0.0.3 (Jan 6 2014)
==================

* `.index()` method
* Automatically create indices after a model has been synced

0.0.2 (Nov 7 2013)
==================

* Fix in class methods

0.0.1 (Nov 6 2013)
==================

* Initial release
