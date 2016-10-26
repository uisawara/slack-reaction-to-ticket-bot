/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
	SlackJIRA reaction -> JIRA issue bot

	[uses]
	on terminal,
		# node slackjira_bot.js

	[JIRA]
	get slack api token
		https://api.slack.com/web

	[Redmine]
	get redmine api token
		enable check [Administration]-[Settings]-[API]-'Enable REST web service'
		get api key [My account]-[API access key]-[Show]

	<Reference>
	https://developer.atlassian.com/jiradev/jira-apis/jira-rest-apis/jira-rest-api-tutorials/jira-rest-api-example-create-issue

	<version history>
	v0.1	first-version.
~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

var Botkit = require('./lib/Botkit.js');
var os = require('os');
var sys = require('util')
var async = require('async');
var request = require('request')
var jsonQuery = require('json-query')
var config = require('./configuration.js')

////////////////////////////////////////////////////////////////////////////////
//	Slackbot

var controller = Botkit.slackbot({
    debug: false,
});

var bot = controller.spawn({
    token: config.slack.token
}).startRTM(function (err, bot, payload) {
    if (err) {
      throw new Error(err)
    }

    console.log('Connected to Slack RTM')
});

controller.on('reaction_added', function(bot, event) {

	if(event.reaction === config.slack.taskmark) {

		buildTaskinfo(event.item_user, event.item.channel, event.item.ts, function (notify) {
			try {

				bot.say({ text: notify, channel: event.item.channel });

				bot.api.reactions.add({
			        timestamp: event.item.ts,
			        channel: event.item.channel,
			        name: 'robot_face',
			    }, function(err, res) {
			        if (err) {
			            bot.botkit.log('Failed to add emoji reaction :(', err);
			        }
			    });

			} catch(e) {
				console.log(e);
			}

		});
	}

});

////////////////////////////////////////////////////////////////////////////////
//	Support methods.

function buildTaskinfo(userid, channelid, messagets, callback) {

	async.series([
		function(callback) {
			async.waterfall([

				// userId -> userName
				function (callback) {
					var url = 'https://slack.com/api/users.list?token=' + config.slack.token;
					request(url, function (error, response, body) {
						callback(null, response)
					})
				},
				function (response, callback) {
					var body = response.body
					var username = jsonQuery('members[id='+userid+']', {data: body})
					var tmp = JSON.parse(username.parents[0].value)
					callback(null, tmp.members[0].name)
				}

			], function (err, username) {
				if(err) {
					callback(err, null);
					return;
				}

				callback(null, username)
			})
		},
		function(callback) {
			async.waterfall([

				// channelId -> channelName
				function (callback) {
					var url = 'https://slack.com/api/channels.list?token=' + config.slack.token;
					request(url, function (error, response, body) {
						callback(null, response)
					})
				},
				function (response, callback) {
					var body = response.body
					var username = jsonQuery('channels[id='+channelid+']', {data: body})
					var tmp = JSON.parse(username.parents[0].value)
					callback(null, tmp.channels[0].name)
				}

			], function (err, channelname) {
				if(err) {
					callback(err, null);
					return;
				}

				callback(null, channelname)
			})
		},
		function(callback) {
			async.waterfall([

				// get message
				function (callback) {
					var url = 'https://slack.com/api/channels.history?token=' + config.slack.token
						+ '&channel=' +channelid
						+ '&latest=' +messagets
						+ '&oldest=' +messagets
						+ '&inclusive=1'
						;
						//console.log(url)
					request(url, function (error, response, body) {
						callback(null, response)
					})
				},
				function (response, callback) {
					try{
						var body = JSON.parse(response.body)
						//console.log(body)
						callback(null, body.messages[0].text)
					}catch(e){
						callback(e, null)
					}
				}

			], function (err, message) {
				if(err) {
					callback(err, null);
					return;
				}
				callback(null, message)
			})
		}

	], function (err, results) {
		if(err) {
			console.log("failure: add task to JIRA")
			return;
		}

		//console.log("results=" + results)
		linkUrl = config.slack.url + 'archives/lab/p' + messagets.replace(/\./, '')
		description = results[2] + " " + linkUrl

		if(config.jira.enable) {
			addJiraTask(
				config.jira.projectkey,
				results[2],
				description,
				config.jira.issuetype,
				channelid,
				messagets,
				callback)
		}

		if(config.redmine.enable) {
			addRedmineTask(
				config.redmine.project,
				config.redmine.tracker,
				results[2],
				description,
				callback
			)
		}

	})

}

////////////////////////////////////////////////////////////////////////////////
//	JIRA methods

function addJiraTask(projectKey, summary, description, issuetype, channelid, messagets, callback) {

	summary = summary.replace(/\n/g, '')

	var requestData = {
		"fields": {
			 "project":
			 {
					"key": projectKey
			 },
			 "summary": summary,
			 "description": description,
			 "issuetype": {
					"name": issuetype
			 }
	 	}
	}
	var options = {
	  url: config.jira.url + 'rest/api/2/issue/',
	  method: 'POST',
	  headers: {
			'Content-Type':'application/json'
		},
	  auth: {
	    user: config.jira.user,
	    password: config.jira.password
	  },
		json: requestData
	}
	request(options, function (error, response, body) {
	  if (error && response.statusCode !== 200) {
	    console.log('Error when contacting')
			return;
	  }

		var notify = '# JIRA ticket: ' + body.key + ' ' + summary + '\n# ' + config.jira.url + 'browse/' + body.key;

		if(callback){
			callback(notify)
		}
	});
}

////////////////////////////////////////////////////////////////////////////////
//	Redmine methods.

function addRedmineTask(projectId, trackerId, subject, description, callback) {

	subject = subject.replace(/\n/g, '')

	var data = {
		key: config.redmine.key,
		"issue": {
			 "project_id": projectId,
			 "tracker_id": trackerId,
			 "subject": subject,
			 "description": description,
			 //"status_id": 1,
			 //"priority_id": 4,
			 //"assigned_to_id": 2,
			 //"fixed_version_id":2,
			 //"parent_issue_id": 6,
			 //"custom_field_values": {"3":"custom value"}
		}
	}
	var options = {
	  url: config.redmine.host + 'issues.json',
	  method: 'POST',
	  headers: {
			//'header':'X-Redmine-API-Key:'+KEY,
			'Content-Type':'application/json;charset=utf-8'
		},
		json: data
	}
	request(options, function (error, response, body) {

	  if (error && response.statusCode !== 200) {
	    console.log('Error when contacting')
			return;
	  }

		var notify = '# Redmine ticket: ' + body.issue.id + ' ' + subject + '\n# ' + config.redmine.host + 'issues/' + body.issue.id;

		callback(notify)
	});

}
