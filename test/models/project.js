"use strict";
function Project(s) {
  /**
   * Field declarations
   */
  this.field("name", s.STRING);

  /**
   * Associations
   */
  this.belongsTo("User");

  /**
   * Options
   */
  this.options({
    timestamps: false
  });
}

module.exports = Project;
