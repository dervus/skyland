import I18n from "I18n"
import { withPluginApi } from "discourse/lib/plugin-api";

function initializeDiscourseTerra(api) {
  api.addNavigationBarItem({
    name: "skyland-chars",
    displayName: I18n.t("skyland.menu.character_list"),
    href: "/skyland/characters",
  })
}

export default {
  name: "skyland",

  initialize(container) {
    const siteSettings = container.lookup("site-settings:main");
    if (siteSettings.skyland_enabled) {
      withPluginApi("0.10.1", initializeDiscourseTerra);
    }
  }
}
