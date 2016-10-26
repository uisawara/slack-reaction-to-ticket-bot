# slackjira_bot.js

reaction to message on Slack channel, bot add to JIRA/Redmine issue.

# install

    # Sample setup for SakuraVPS

    # setup nodejs
    git clone git://github.com/creationix/nvm.git ~/.node
    . ~/.node/nvm.sh
    nvm install v0.10.13
    npm install async
    npm install request
    npm install json-query

    # setup slackjira_bot
    git clone git@github.com:howdyai/botkit.git
    git clone https://github.com/uisawara/slackjira_bot.js.git
    cp configuration.js.sample configuration.js
    # edit and setup configuration.js

    # boot slackjira_bot
    node slackijra_bot.js

# setup

1. setup bot
    edit slackjira_bot.js configuration.
2. boot bot
  on terminal,
    # node slackjira_bot.js
3. invite bot to slack channel

## JIRA

get slack api token
  https://api.slack.com/web

## Redmine

get redmine api token
  enable check [Administration]-[Settings]-[API]-'Enable REST web service'
  get api key [My account]-[API access key]-[Show]

# Related Link

https://developer.atlassian.com/jiradev/jira-apis/jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-example-create-issue
