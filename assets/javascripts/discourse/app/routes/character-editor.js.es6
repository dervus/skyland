import { ajax } from "discourse/lib/ajax"
import DiscourseRoute from "discourse/routes/discourse"

export default DiscourseRoute.extend({
  model(params) {
    const isnew = params.character_id === "new"

    return Promise.all([
      ajax("/skyland/campaign"),
      isnew ? this.store.createRecord("character") : this.store.find("character", params.character_id),
    ]).then((data) => {
      return { campaign: data[0], character: data[1] }
    })
  },

  // afterModel(model, transition) {
  //   if (!model.campaign.isMaster(this.get("currentUser")) &&
  //       model.character.status !== "pending" &&
  //       model.character.status !== "rejected") {
  //     this.transitionTo("character-list")
  //   }
  // },

  setupController(controller, model) {
    controller.setCampaignData(model.campaign)
    controller.set("character", model.character)
  }
})
