---
id: indexing
title: Indexing
sidebar_label: Indexing
---

Leek index events into elasticsearch cluster, but how it manages different elasticsearch index for each organisation,
for each organization application and for each application environment?

### Organisation/Application indices

When a user creates a new leek application, leek starts by creating a new index template for that application. an 
elasticsearch index template allows leek to define templates that will automatically be applied when new application 
indices are created. The templates include both settings and mappings and a simple pattern template that controls 
whether the template should be applied to the new index.

An Index template is considered as a Leek Application, the application name and organisation name will be combined 
together as `orgname-appname` to form the final index template name. 

for example when a user with the email `john@example.com` belonging to organization with domain `example.com` creates 
a new application with the name `leek`. an Index template will be created with the name `example.com-leek`.

And when users belonging to the same organization try to list the available organization applications, Leek will only 
return applications starting with `example.com-*`

When creating the index template, Leek will add a metadata to the index template with:

- **Application owner** - the application owner is the email of the user who created the application, this metadata 
field is useful to control who can perform write actions against the application, like deleting application, purging 
application and managing triggers.

- **Creation time** - when the application was first created.

- **API Key** - the API key that will be used for Leek agent to fanout celery events to Leek API, this is only used with 
standalone agents, local agents is using a shared secret between Agent and API and provided as an environment variable.

![Application](/img/docs/agent.png)

After creating the application (index template), leek will create an initial index with the name `orgname-appname-00001`
and the index template will automatically be applied to it because it matches the index pattern in the template.

![Indices](/img/docs/indices.png)

### Environment separation

When the mapping is applied to the index, a property named `env_name` will be used to isolate different events from 
different application environments in the same index. 

The agent will always send the `env_name` header enclosed with the request, and Leek will add it to ES document during 
the indexation of the events.

### Events types separation

The mapping properties include a property named `kind` and used by leek to separate different kind of events. when the 
agent sends tasks events, they will be indexed with `kind=task`. in the other hand, when the agent sends workers events, 
they will be indexed with `kind=worker`.

### Index mapping properties

These are the available tasks and workers properties that leek supports for now:

```python
properties = {
    # Shared
    "kind": {
        "type": "keyword",
    },
    "state": {
        "type": "keyword",
    },
    "timestamp": {
        "type": "long"
    },
    "exact_timestamp": {
        "type": "double"
    },
    "utcoffset": {
        "type": "long"
    },
    "pid": {
        "type": "long"
    },
    "clock": {
        "type": "long"
    },
    "app_env": {
        "type": "keyword"
    },
    "events_count": {
        "type": "long"
    },
    # Tasks specific
    "uuid": {
        "type": "keyword",
    },
    "root_id": {
        "type": "keyword",
    },
    "parent_id": {
        "type": "keyword",
    },
    "name": {
        "type": "keyword",
    },
    "worker": {
        "type": "keyword",
    },
    "client": {
        "type": "keyword",
    },
    # Times
    "eta": {
        "type": "long"
    },
    "expires": {
        "type": "long"
    },
    "queued_at": {
        "type": "long"
    },
    "received_at": {
        "type": "long"
    },
    "started_at": {
        "type": "long"
    },
    "succeeded_at": {
        "type": "long"
    },
    "failed_at": {
        "type": "long"
    },
    "rejected_at": {
        "type": "long"
    },
    "revoked_at": {
        "type": "long"
    },
    "retried_at": {
        "type": "long"
    },
    "args": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    "kwargs": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    "result": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    "runtime": {
        "type": "double"
    },
    "retries": {
        "type": "long"
    },
    "exception": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    "traceback": {
        "type": "text",
        "fields": {
            "keyword": {
                "type": "keyword",
                "ignore_above": 256
            }
        }
    },
    # Workers specific
    "hostname": {
        "type": "keyword",
    },
    "online_at": {
        "type": "double"
    },
    "offline_at": {
        "type": "double"
    },
    "last_heartbeat_at": {
        "type": "double"
    },
    "processed": {
        "type": "long"
    },
    "active": {
        "type": "long"
    },
    "loadavg": {
        "type": "float"
    },
    "freq": {
        "type": "float"
    },
    "sw_ident": {
        "type": "keyword"
    },
    "sw_sys": {
        "type": "keyword",
    },
    "sw_ver": {
        "type": "keyword",
    },
    # -- For revoked tasks
    "terminated": {
        "type": "boolean",
    },
    "expired": {
        "type": "boolean",
    },
    "signum": {
        "type": "keyword",
    },
    # -- For rejected tasks
    "requeue": {
        "type": "boolean",
    },
    # Broker specific
    "exchange": {
        "type": "keyword",
    },
    "routing_key": {
        "type": "keyword",
    },
    "queue": {
        "type": "keyword",
    },
}
```

### Index template

This is an example of an index template for the application `appname` belonging to the organization `orgname`:

```python
template = {
    "index_patterns": [
        f"orgname-appname*"
    ],
    "template": {
        "settings": {
            "index": {
                "number_of_shards": "2",
                "number_of_replicas": "1",
            },
            "index.lifecycle.name": "default",
            "index.lifecycle.rollover_alias": f"{orgname-appname}-rolled"
        },
        "aliases": {
            'orgname-appname': {}
        },
        "mappings": {
            "_source": {
                "enabled": True
            },
            "_meta": metadata,
            "dynamic": False,
            "properties": properties
        },
    }
}
```