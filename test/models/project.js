"use strict";
function Project(m) {
  /**
   * Field declarations
   */
  m.field("name", m.STRING);

  /**
   * Associations
   */
  m.belongsTo("User");

  /**
   * Options
   */
  m.options({
    timestamps: false
  });
}

module.exports = Project;
