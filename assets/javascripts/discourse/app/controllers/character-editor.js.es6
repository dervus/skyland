import I18n from "I18n"
import dcomp from "discourse-common/utils/decorators"
import showModal from "discourse/lib/show-modal"
import Controller from "@ember/controller"
import { A } from "@ember/array"

export default Controller.extend({
  setCampaignData(data) {
    this.setProperties({
      campaign: data,
      blocks: _.map(data.blocks, block => {
        return {
          name: block.name,
          info: block.info,
          roles: _.map(block.roles, id => {
            const role = data.role[id]
            return {
              id: id,
              name: role.name,
              name_female: role.name,
              requires: function (tags) { return true },
              provides: role.provides
            }
          })
        }
      }),
      locationlist: makelist(data.location),
      racelist: makelist(data.race),
      classlist: makelist(data.class),
      armorlist: makelist(data.armor),
      weaponlist: makelist(data.weapon),
      traitlist: makelist(data.trait)
    })
  },

  @dcomp("character.gender")
  female(gender) { return gender === "female" },

  @dcomp("campaign", "character.role", "character.gender", "character.race", "character.class", "character.armor", "character.weapon", "character.traits", "character.location")
  tags(campaign, role, gender, race, klass, armor, weapon, traits, location) {
    const tags = new Map()
    if (gender) { tags.set(`gender/${gender}`, 1) }

    const mix = (more) => {
      if (more && more.provides) {
        _.each(more.provides, (value, tag) => {
          tags.set(tag, value + (tags.get(tag) || 0))
        })
      }
    }
    mix(campaign.role[role])
    mix(campaign.location[location])
    mix(campaign.race[race])
    mix(campaign.class[klass])
    mix(campaign.armor[armor])
    mix(campaign.weapon[weapon])
    _.each(traits, id => mix(campaign.trait[id]))

    return tags
  },

  @dcomp("tags")
  tagsDebug(tags) {
    const o = []
    tags.forEach((value, tag) => {
      o.push(`${tag} = ${value}`)
    })
    return o.sort().join("\n")
  },

  @dcomp("character.role", "character.gender", "character.race", "character.class", "character.armor", "character.weapon", "character.traits", "character.location")
  formDebug(role, gender, race, klass, armor, weapon, traits, location) {
    return [
      `role = ${role}`,
      `location = ${location}`,
      `gender = ${gender}`,
      `race = ${race}`,
      `class = ${klass}`,
      `armor = ${armor}`,
      `weapon = ${weapon}`,
      `traits = ${traits}`
    ].join("\n")
  },

  actions: {
    select(name, value, state) {
      switch (name) {
      case "role":
      case "gender":
      case "race":
      case "class":
      case "location":
        if (state) { this.character.set(name, value) }
        break
      case "armor":
      case "weapon":
        this.character.set(name, state ? value : null)
        break
      case "trait":
        const update = A([])
        this.character.traits.forEach(id => update.pushObject(id))
        if (state) { update.addObject(value) }
        else { update.removeObject(value) }
        this.character.set("traits", update)
        break
      }

      const self = this
      const fix = (name) => {
        const found = self[`${name}list`].find(i => i.id === self.character[name])
        if (found && !found.requires(self.tags)) { self.character.set(name, null) }
      }
      const fix_traits = () => {
        const toRemove = []
        _.each(self.character.traits, id => {
          const found = self.traitlist.find(i => i.id === self.character[name])
          if (found && !found.requires(self.tags)) { toRemove.push(id) }
        })

        const update = A([])
        _.each(self.character.traits, id => update.pushObject(id))
        toRemove.forEach(id => update.removeObject(id))
        self.character.set("traits", update)
      }
      fix("location")
      fix("race")
      fix("class")
      fix("armor")
      fix("weapon")
      fix_traits()
    },

    hover(name, value, show) {
      const prop = `${name}info`
      if (show) {
        const meta = name !== "role" ? this.campaign[name][value] : this.campaign.role[value]
        if (meta.info || meta.preview) {
          const prefix = Discourse.SiteSettings.skyland_assets_path
          const data = {
            name: (this.female && meta.female_name) ? meta.female_name : meta.name,
            desc: meta.info,
            preview: meta.preview ? (prefix + meta.preview) : null
          }
          this.set(prop, data)
        }
      } else {
        this.set(prop, null)
      }
    },

    submit() {
      this.character.save().then(character => {
        this.transitionToRoute("character-list")
      }).catch(error => {
        let message
        if (error.errorThrown === "Conflict") {
          message = I18n.t("skyland.character_editor.name_is_already_taken")
        } else {
          message = I18n.t("skyland.character_editor.unexpected_error")
        }
        const debug = error.jqXHR.responseText
        showModal("character-save-info", { model: { message, debug } })
      })
    }
  }
})

function makelist(col) {
  return _.chain(col)
    .keys()
    .map(key => {
      const val = col[key]
      const name = capitalize(val.name)
      const [cost_type, cost] = parseCost((val.provides || {})["trait/cost"])
      return {
        id: key,
        name,
        name_female: val.name_female ? capitalize(val.name_female) : name,
        cost,
        cost_type,
        requires: compileCondition(val.requires),
        provides: val.provides
      }
    })
    .sortBy(["cost", "order", "name"])
    .value()
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function parseCost(cost) {
  if (cost && cost > 0) {
    return ["positive", "+" + cost.toString()]
  } else if (cost && cost < 0) {
    return ["negative", cost.toString()]
  } else {
    return [null, null]
  }
}

function compileCondition(cond) {
  return new Function("tags", "return " + translateCondition(cond))
}

function translateCondition(cond) {
  if (_.isObject(cond)) {
    if ("not" in cond) {
      return "!" + translateCondition(cond.not)
    } else if ("has" in cond) {
      return "tags.has(" + JSON.stringify(cond.has) + ")"
    } else if ("and" in cond) {
      return "(" + cond.and.map(inner => translateCondition(inner)).join(" && ") + ")"
    } else if ("or" in cond) {
      return "(" + cond.or.map(inner => translateCondition(inner)).join(" || ") + ")"
    }
  }
  return "true"
}
