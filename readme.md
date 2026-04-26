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
  collections analyst_hooks
  rectangle generated_types
}

queue mqtt_broker
rectangle ems_device_api
rectangle ems_analyst_api


ems_device_api <-r- generated_types: GET /asyncapi\n(build time)
generated_types -r-> mqtt_provider: topic constants\n+ message types
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

ems_device_api -> generated_types: POST /topology → AsyncAPI spec
generated_types -> mqtt_provider: import topics + message types

mqtt_broker -> mqtt_provider: publish measurement
mqtt_provider -> hmi_component: useSubscription<T>(topic)\n→ { value, timestamp (UTC), status }
hmi_component -> hmi_component: render
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

