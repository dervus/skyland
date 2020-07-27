import dcomp from "discourse-common/utils/decorators"
import Component from "@ember/component"
import { isArray } from "@ember/array"

export default Component.extend({
  tagName: "button",
  classNameBindings: ["selected", "invalid"],

  value: null,
  binding: null,
  requires: (() => true),
  tags: new Map(),
  select: (() => {}),
  hover: (() => {}),

  @dcomp("value", "binding")
  selected(value, binding) {
    if (isArray(binding)) {
      return binding.includes(value)
    } else {
      return value === binding
    }
  },

  @dcomp("requires", "tags")
  invalid(requires, tags) {
    return !requires(tags)
  },

  click() {
    this.select(this.name, this.value, !this.selected)
  },

  mouseEnter() {
    this.hover(this.name, this.value, true)
  },

  mouseLeave() {
    this.hover(this.name, this.value, false)
  }
})
