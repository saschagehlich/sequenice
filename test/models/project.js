function Project(s) {
  /**
   * Field declarations
   */
  this.field("name", s.STRING);

  /**
   * Associations
   */
  this.belongsTo("User");
}
