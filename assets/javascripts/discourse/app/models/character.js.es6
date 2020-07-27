import RestModel from "discourse/models/rest"

export default RestModel.extend({
  init() {
    this._super(...arguments)
    this.setDefaults({
      name: "",
      name_extra: "",
      info: "",
      role: null,
      location: null,
      gender: null,
      race: null,
      class: null,
      armor: null,
      weapon: null,
      traits: [],
    })
  },

  setDefaults(values) {
    _.forEach(values, (value, key) => {
      if (this.get(key) === undefined) {
        this.set(key, value)
      }
    })
  },

  invalidFields() {
    return ["name", "role", "location", "gender", "race", "class"].filter(f => isBlank(this.get(f)))
  },

  updateProperties() {
    return this.getProperties([
      "name",
      "name_extra",
      "info",
      "role",
      "location",
      "gender",
      "race",
      "class",
      "armor",
      "weapon",
      "traits",
    ])
  },

  createProperties() {
    return this.updateProperties()
  }
})

function isBlank(str) {
  return str == null || str.trim() === ""
}
