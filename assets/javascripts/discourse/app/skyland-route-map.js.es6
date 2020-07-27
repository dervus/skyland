export default function () {
  this.route("character-list", { path: "/skyland/characters" })
  this.route("character-editor", { path: "/skyland/characters/:character_id" })
}
