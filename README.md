# Vunsh-Handler-V2
A modular Discord.js command and event handler. An improved version of my old, unfinished handler uploaded 7 months ago for my bot Vunsh (scrapped). It’s now designed to be used in many more projects moving forward.

# Installation

1. Clone the Repository
```bash
git clone https://github.com/2192008/Vunsh-Handler-V2.git
cd Vunsh-Handler-V2
```

2. Install Dependencies
```bash
npm i chalk@4.1.2 discord.js@14.22.1 dotenv@17.2.2  moment@2.30.1  mongoose@8.18.00
```
> ⚠️ Note: These are the package versions that were tested when creating this handler and everything worked fine with no deprecations. You are free to test, change, or try other versions of these packages, but chalk must remain @4.1.2 or earlier since later versions use ESM only and will break the handler.

3. Configure `config.json`
- Navigate to `src/Data/Json/config.json`

Configurable Options
- `version` – The current version of the client.
- `developers` – An array of developer objects. Each object should contain:
  - `username` – The username of the developer.
  - `id` – The Discord user ID of the developer.
- `support` – The URL to your Discord support server.
- `errorLogs` – The ID of the Discord channel where uncaught errors and execution errors will be logged via webhook. Required for the AntiCrash system.
- `mongoose` – Database configuration. Currently only has:
  - `enabled` – true or false to enable MongoDB connection.
- `prefix` – Configuration for prefix commands:
  - `prefix` – The default prefix used for prefix commands.
- `slash` – Slash command configuration:
  - `testGuild` – The ID of the guild where private/testing slash commands will be deployed.
`statuses` – Array of activity/status objects. Each object can configure:
  - `enabled` – Whether this status is active.
  - `content` – The text/content displayed in the status.
  - `displayTime` – How long (in seconds) this status is displayed before switching.
  - `type` – Discord activity type.

4. Create `.env` file

- In the root directory of your project, create a file named .env.
- Add the following variables:
```ini
TOKEN=
MONGO= # Only required if using MongoDB
```
> ⚠️ Note: If you plan to use MongoDB, make sure `mongoose.enabled` is set to true in `config.json`. Otherwise, the handler will not start mongoose initialization.

5. Run the project
```bash
node .
```
Your bot should now connect to Discord with the improved handler, ready to process both prefix and slash commands.

# Changlog-ish Report (Since Version 1)

## Status System Improvements
The status system has been significantly upgraded from the previous handler. Previously, you could only configure a single status type and a single rotation speed, like this:
```js
"status": {
  "enabled": true,
  "statuses": [
    "{prefix}help",
    "discord.gg/cereal"
  ],
  "display_time": 10
}
```
Now, the new system allows for multiple, fully configurable statuses. Each status can have its own content, display duration, and type, giving you much more flexibility:
```js
"statuses": [
  {
    "enabled": true,
    "content": "{prefix}help",
    "displayTime": 5,
    "type": 3
  },
  {
    "enabled": true,
    "content": "Powered by Vunsh",
    "displayTime": 10,
    "type": 4
  }
]
```

## AntiCrash System
The handler now includes a more robust AntiCrash system that significantly improves stability and error reporting. This system supports two types of error catching:

1. Process-level errors
  
   Captures `unhandledRejection` and `uncaughtException` events.

   Sends detailed error reports to your designated error logs channel via webhook.

3. Command execution errors

   Captures errors that occur during command execution for both prefix and slash commands.
   
   Includes the author, command name, and arguments (for slash commands, this uses `interaction.options`).

> ⚠️ Note: For execution error reporting to run smoothly, both the `errorLogs` and `support` fields **must** be defined in your `config.json`. These fields are required because the system includes a Support button linking to your Discord server.

This system effectively makes the bot much more resilient to crashes, although it may have side effects depending on your environment. Errors are logged via webhooks, allowing you to monitor issues in real time without crashing the bot.

## Slash Command Registration
The interaction (slash) command system has also been significantly improved:

- Selective Registration: Previously, all commands were unregistered and then re-registered each time. Now, only commands that have changed are updated, reducing unnecessary API calls and downtime.

- Default Member Permissions: Commands now include `default_member_permissions`, ensuring that only users with the proper permissions can see and access them. Even if this fails, additional permission validations occur when the command is executed.

- Private Slash Commands: The `global` field, previously present but non-functional, is now fully implemented. Setting `global: false` on a command ensures it is deployed only to the testing guild specified in `slash.testGuild` found in `config.json`.

### Example
```js
{
  "name": "ban",
  "description": "Ban a member",
  "slash": {
    "options": [],
    "global": false
  },
  "permissions": {
    "user": ["BanMembers"],
    "client": ["BanMembers"]
  }
}
```
In this example, the `ban` command will only be registered in the testing guild, and only members with the `BanMembers` permission can see it.

## Command Handler & Cooldowns
The main command handler has been fully rewritten for efficiency and maintainability. Key improvements include:

- Unified System: Both prefix and slash commands are handled cleanly within the same structure.
- Cooldowns: The cooldown system now works reliably for both prefix and slash commands, preventing command spam while providing dynamic feedback to users on when they can use a command again.

### Example:

```js
{
  "name": "ping",
  "cooldown": 5
}
```

In this example, users must wait 5 seconds between uses, whether using the prefix command or slash command. Cooldown messages automatically deleted after expiration, keeping channels clean.
