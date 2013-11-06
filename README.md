Nothing to see here, yet.

`sequenice` will be a wrapper for `sequelize` which will result in a nicer
code structure for models. I'm aiming for something like this:

```js
// user.js
function User(s) {
  /**
   * Field definitions
   */
  this.field("name", s.STRING);
  this.field("password", s.STRING);
  this.field("isAdmin", s.BOOLEAN, { defaultValue: false });

  /**
   * Associations
   */
  this.hasMany("Project", { joinTableModel: "UserProjects" });

  /**
   * Hooks
   */
  this.beforeCreate("myBeforeCreateMethod");

  /**
   * Getters
   */
  this.get("myVariableName");

  /**
   * Setters
   */
  this.set("myVariableName");
}

User.prototype.getMyVariableName = function () {
  return this._myVariableName;
}

User.prototype.setMyVariableName = function (value) {
  this._myVariableName = value;
}

User.prototype.someInstanceMethod = function () {

}

User.someClassMethod = function () {

}
```
