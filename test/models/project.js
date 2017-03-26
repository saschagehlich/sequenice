export default class Project {
  constructor (m) {
    /**
     * Field declarations
     */
    m.field('name', m.STRING)

    /**
     * Associations
     */
    m.belongsTo('User')

    /**
     * Options
     */
    m.options({
      timestamps: false
    })
  }
}
