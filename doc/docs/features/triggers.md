---
id: triggers
title: Triggers
sidebar_label: Triggers
---

Leek notification trigger is a set of rules matched against indexed events during notification pipeline and when these 
rules are fulfilled at the end of the pipeline, Leek sends a notification message to Slack.

These rules are created using the bellow form in http://0.0.0.0:8000/applications and stored in the application index 
template as a json array.

![Applications](/img/docs/create-triggers.png)

Every time Leek receives events, it will index them first and after a successful indexation the events are sent to a
notification pipeline, the pipeline will get the fanout triggers from the related application and for each trigger it 
will check if the indexed events matches the rules on the trigger, The rules can be:

- **enabled** - trigger enabled field is a boolean field to control activation and deactivation of the trigger, if the 
trigger is disabled the pipeline will be skipped, otherwise it will continue to test other matchers.

- **envs** - an array field with the list of environments where this trigger rule will be matched. if the indexed 
events came from a different environment than the defined list, the pipeline will be skipped, otherwise the pipeline 
will move to the next rule. an empty envs array means a wildcard and events with any env will be considered matched 
against this rule. 
> This rule can be useful if you are interested in receiving notifications just for some environments like production.

- **states** - an array field with a list of states, if any of the indexed events with a different state than the states 
defined in the list, the pipeline will be skipped. otherwise, the pipeline will move the the next rule. the same as envs 
rules, an empty states array means a wildcard and events with any state will be considered matched against this rule. 
> This rule can be useful if you want to receive notification for events with critical states like FAILED, CRITICAL and 
> RECOVERED states.

- **exclusions** - an array field holding a list of regular expressions the trigger will apply against tasks names, if
any of the indexed tasks match this rule the pipeline will exclude and skip the pipeline, otherwise the pipeline will 
move to the next rule - only one of exclusions|inclusions can be specified. 
> This rule can be useful if you are not interested in receiving notification from noisy tasks that having a tendency 
> to fail very often.

- **inclusions** - an array field holding a list of regular expressions the trigger will apply against tasks names, if 
any of the indexed tasks match this rule the pipeline will continue to next rule, otherwise this rule will not be 
matched and the pipeline will be skipped. an empty inclusions array means a wildcard and tasks with any name will be 
considered matched against this rule. 
> This rule is useful if you are interested in receiving notifications just for a subset of tasks, or if you want to 
> route tasks notification to different channels depending on their names and/or package names.

- **runtime_upper_bound** - a number field representing the task execution runtime upper bound, the runtime attribute is
only available with SUCCEEDED|RECOVERED tasks. if any of the indexed succeeded tasks exceeds the runtime upper bound 
this rule will be matched and the pipeline will send a slack message indicating that the tasks took a long time to 
finish. 
> This can be useful to monitor critical tasks latencies.

### Trigger Example

In the example bellow, Leek will send a notification message to slack if:

- The task is a production task (tagged with prod).

- The task state is one of SUCCEEDED | RECOVERED | CRITICAL.

- If the task is SUCCEEDED | RECOVERED only notify if its runtime exceeds 20 seconds

- Do not notify tasks with a name starting by `tasks.test.`


![Create a Trigger](/img/docs/create-trigger.png)


### Triggers List

After creating the trigger, it will be added to triggers list as shown bellow:

![Triggers List](/img/docs/triggers-list.png)

### Slack notification

This is an example of Leek slack notification

![Slack](/img/docs/slack.png)