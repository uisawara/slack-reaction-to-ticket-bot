# slackjira_bot.js

reaction to message on Slack channel, bot add to JIRA/Redmine issue.

# setup

1. setup bot
    edit slackjira_bot.js configuration.
2. boot bot
  on terminal,
    # node slackjira_bot.js
3. invite bot to slack channel

# setup

## JIRA

get slack api token
  https://api.slack.com/web

## Redmine

get redmine api token
  enable check [Administration]-[Settings]-[API]-'Enable REST web service'
  get api key [My account]-[API access key]-[Show]

# Related Link

https://developer.atlassian.com/jiradev/jira-apis/jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-example-create-issue
