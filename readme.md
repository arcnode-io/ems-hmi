# EMS HMI 🖥️📱

![](https://img.shields.io/gitlab/pipeline-status/arcnode-io/ems-hmi?branch=main&logo=gitlab)
![](https://gitlab.com/arcnode-io/ems-hmi/badges/main/coverage.svg)
![](https://img.shields.io/badge/24-gray?logo=nodedotjs)
![](https://img.shields.io/badge/5.6-gray?logo=typescript)
![](https://img.shields.io/badge/react-gray?logo=react)
![](https://img.shields.io/badge/vite-gray?logo=vite)

> Energy management system interface for mobile and web

## Deployment
```plantuml
rectangle ems_hmi {

  collections hmi_components
  collections analyst_components

  rectangle mqtt_provider
  collections contexts
  collections analyst_hooks
  rectangle generated_types
}

queue mqtt_broker
rectangle ems_device_api
rectangle ems_analyst_api


ems_device_api <-r- generated_types: GET /asyncapi\n(build time — message-schema codegen)
ems_device_api <-r- contexts: GET /topology/sld.svg /asyncapi /topology/view
generated_types -r-> mqtt_provider: typed message decoders
contexts -r-> hmi_components: devices + buses + per-measurement,\n SVG string for SLDDiagram
mqtt_provider --> mqtt_broker: MQTT\n over WebSocket
hmi_components --> mqtt_provider
analyst_components --> analyst_hooks

analyst_hooks --> ems_analyst_api: HTTP REST

```

### Real-time device data
```plantuml
participant ems_device_api
queue mqtt_broker

box "hmi" #white
  participant generated_types
  participant mqtt_provider
  participant hmi_component
end box

ems_device_api -> generated_types: build-time codegen from AsyncAPI message schemas
generated_types -> mqtt_provider: typed message decoders

mqtt_broker -> mqtt_provider: publish measurement
mqtt_provider -> hmi_component: useSubscription<T>(topic)\n→ { value, timestamp (UTC), status }
hmi_component -> hmi_component: render
```

### Boot — topology view + SLD SVG
```plantuml
participant browser
participant ems_device_api

box "hmi" #white
  participant topology_context
  participant sld_context
end box

browser -> topology_context: app boot
topology_context -> ems_device_api: GET /topology/view
ems_device_api --> topology_context: sanitized DTM:\ndevices + buses + per-measurement metadata
sld_context -> ems_device_api: GET /topology/sld.svg
ems_device_api --> sld_context: svg string
```

On `system/topology_changed`, both contexts re-fetch and swap. Components re-render against the new device list / buses / SVG.

### Demo deployment (S3)
```plantuml
rectangle s3_bucket {
  rectangle dist {
    rectangle js_bundle
    rectangle index_html
  }
  rectangle api_fixtures {
    rectangle topology_view_json
    rectangle sld_svg
  }
}

rectangle ec2_sandbox_analyst_api 
ec2_sandbox_analyst_api - js_bundle 
```


<!-- TODO: add project structure tree (npm workspaces layout, component inventory, routing) -->

### Analyst queries
```plantuml
participant ems_analyst_api
box "hmi" #white
  participant hmi_component
  participant analyst_hooks
end box


hmi_component -> analyst_hooks: useHistorical(params)
analyst_hooks -> ems_analyst_api: GET /historical
ems_analyst_api --> analyst_hooks: timeseries data
analyst_hooks --> hmi_component: { data, loading, error }

hmi_component -> analyst_hooks: usePredictions(params)
analyst_hooks -> ems_analyst_api: GET /predictions
ems_analyst_api --> analyst_hooks: forecast data
analyst_hooks --> hmi_component: { data, loading, error }

hmi_component -> analyst_hooks: useChat(sessionId)
analyst_hooks -> ems_analyst_api: POST /chat
ems_analyst_api --> analyst_hooks: AI response
analyst_hooks --> hmi_component: { messages, send, loading }
```

