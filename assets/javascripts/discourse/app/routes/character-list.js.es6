import { ajax } from "discourse/lib/ajax"
import DiscourseRoute from "discourse/routes/discourse"

export default DiscourseRoute.extend({
  model(params) {
    return Promise.all([
      ajax("/skyland/account"),
      ajax("/skyland/campaign"),
      ajax("/skyland/characters"),
    ]).then(([account, campaign, items]) => {
      return { account: account.account, campaign, items }
    })
  },

  setupController(controller, model) {
    controller.setProperties(model)
  }
})
