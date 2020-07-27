# name: skyland
# about: Integrates Discourse with Terra API
# version: 0.1
# authors: Stif

register_asset "stylesheets/common/skyland.scss"
enabled_site_setting :skyland_enabled

PLUGIN_NAME ||= "skyland"

after_initialize do
  require "uri"
  require "net/http"

  module ::Skyland
    class Engine < ::Rails::Engine
      engine_name PLUGIN_NAME
      isolate_namespace Skyland
    end
  end

  module Skyland::HttpUtil
    def self.http(method, path, body = nil)
      uri = URI(SiteSetting.skyland_terra_api + path)

      unless body.nil?
        req = method.new(uri, "Content-Type" => "application/json")
        req.body = MultiJson.dump(body)
      else
        req = method.new(uri)
      end

      res = Net::HTTP.start(uri.hostname, uri.port) { |w| w.request(req) }
      out = { code: res.code.to_i }
      out[:data] = MultiJson.load(res.body) unless res.body.blank?
      out
    end

    def self.get(path, body = nil)
      http(Net::HTTP::Get, path, body)
    end

    def self.post(path, body = nil)
      http(Net::HTTP::Post, path, body)
    end

    def self.put(path, body = nil)
      http(Net::HTTP::Put, path, body)
    end

    def self.patch(path, body = nil)
      http(Net::HTTP::Patch, path, body)
    end

    def self.delete(path, body = nil)
      http(Net::HTTP::Delete, path, body)
    end
  end

  class Skyland::CampaignController < ::ApplicationController
    requires_plugin PLUGIN_NAME

    def get
      res = Skyland::HttpUtil.get("/campaign")
      render_json_dump(res[:data])
    end
  end

  class Skyland::AccountsController < ::ApplicationController
    requires_plugin PLUGIN_NAME
    requires_login

    def show
      res = Skyland::HttpUtil.get("/accounts/#{current_user.id}")
      if res[:code] == 200
        render_json_dump({ account: res[:data] })
      else
        render_json_dump({ account: nil })
      end
    end

    def update
      data = {
        username: params.require(:username),
        password: params.require(:password),
      }
      res = Skyland::HttpUtil.put("/accounts/#{current_user.id}", data)
      render_json_dump({ success: res[:code] == 204 })
    end
  end

  class Skyland::CharactersController < ::ApplicationController
    requires_plugin PLUGIN_NAME
    requires_login

    def index
      data = {}
      data[:mine] = Skyland::HttpUtil.get("/characters/mine/#{current_user.id}")[:data]
      data[:other] = Skyland::HttpUtil.get("/characters/other/#{current_user.id}")[:data] if current_user.staff?
      render_json_dump(data)
    end

    def new
    end

    def create
      c = params.require(:character)
      data = {
        account: current_user.id
      }
      %i(name role location race class).each do |k|
        data[k] = c.require(k)
      end
      %i(name_extra info armor weapon traits).each do |k|
        data[k] = c[k] unless c[k].blank?
      end
      res = Skyland::HttpUtil.post("/characters", data)
      render_json_dump(res[:data], status: res[:code])
    end

    def show
    end

    def update
    end

    def delete
    end

    def check_name
      data = { name: params.require(:name) }
      res = Skyland::HttpUtil.post("/characters", data)[:data]
      render_json_dump(res)
    end
  end

  Skyland::Engine.routes.draw do
    get "/campaign" => "campaign#get"
    resource :account, only: [:show, :update]
    resources :characters, except: [:edit] do
      get "check_name"
    end
  end

  Discourse::Application.routes.append do
    mount Skyland::Engine, at: "/skyland"
  end
end
