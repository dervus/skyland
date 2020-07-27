import RestAdapter from "discourse/adapters/rest"

export default RestAdapter.extend({
  basePath(store, type) {
    return "/skyland/"
  }
})
