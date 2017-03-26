export default class User {
  constructor (m) {
    /**
     * Field declarations
     */
    m.field('name', m.STRING)
    m.field('isAdmin', m.BOOLEAN, { defaultValue: false })
    m.field('beforeCreateCalled', m.BOOLEAN, { defaultValue: false })
    m.field('priceInCents', m.INTEGER)

    /**
     * Associations
     */
    m.hasMany('Project')

    /**
     * Getters
     */
    m.get('price')
    m.get('priceInCents')

    /**
     * Setters
     */
    m.set('price')

    /**
     * Hooks
     */
    m.beforeCreate('myBeforeCreateMethod')

    /**
     * Validations
     */
    m.validates('myValidationMethod')
  }

  static classMethod () {}
  instanceMethod () {}

  _getPrice () {
    return `$${this.getDataValue('priceInCents') / 100}`
  }

  _getPriceInCents () {
    return this.dataValues.priceInCents
  }

  _setPrice (value) {
    this.dataValues.priceInCents = value * 100
  }

  myBeforeCreateMethod (user) {
    user.beforeCreateCalled = true
  }

  myValidationMethod () {

  }
}
