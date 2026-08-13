# Fortnite Account Generator Bot

A Fortnite-themed Discord account generator matching the included reference screenshots:

- Public `FREE Account Claimed!` generation embeds
- Private account detail DMs with email, password, locker summary, verification status, visual card, and Previous / Next / Close buttons
- Free and Premium stock
- Claim history and premium access
- Configurable generation channels, logging, cooldowns, admin role, and embed appearance

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Create your environment file:

   ```bash
   cp .env.example .env
   ```

   Fill in:

   - `DISCORD_BOT_TOKEN` — bot token from the Discord Developer Portal
   - `CLIENT_ID` — application ID
   - `GUILD_ID` — optional server ID for instant test command registration

3. Register the commands:

   ```bash
   npm run deploy
   ```

4. Start the bot:

   ```bash
   npm start
   ```

`GUILD_ID` registration is immediate. Global registration can take Discord up to an hour to appear. After global commands are live, admins can use `/sync` to re-register them globally.

## Commands from the screenshots

### User commands

| Command | Description |
| --- | --- |
| `/generate` | Generate a free or premium account with verification |
| `/claimhistory` | Check your claim history |
| `/help` | Show all available commands |
| `/viewstock` | Check current free and premium stock |

### Admin commands

| Command | Description |
| --- | --- |
| `/addstock` | Add one account to free or premium stock |
| `/clearstock` | Remove all unused accounts from a tier |
| `/config` | Show current bot configuration |
| `/edit` | Customize embed color, title, and footer |
| `/givepremium` | Give premium access to a user for a number of days |
| `/removestock` | Remove one unused account by email |
| `/setadminrole` | Set the admin role name |
| `/setchannel` | Set the free or premium generation channel |
| `/setcooldown` | Set free or premium generation cooldown |
| `/sethypefree` | Deprecated compatibility command |
| `/sethypremium` | Deprecated compatibility command |
| `/setlogchannel` | Set the generation log channel |
| `/stock` | Check current stock levels |
| `/sync` | Force-sync slash commands globally |
| `/togglehype` | Deprecated compatibility command |
| `/uploadstock` | Upload a `.txt` file with one account per line |

## Stock formats

### Simple `.txt` format

One account per line:

```text
email@example.com:Password123
another@example.com:AnotherPassword
```

### Full account JSON

Use this with `/addstock`, one JSON object at a time:

```json
{
  "email": "player@example.com",
  "password": "Password123",
  "displayName": "DaMayorMike",
  "accountId": "8711fce7aebb4f11926083fd645429a6",
  "linkedPlatforms": ["Xbox", "Epic", "YouTube"],
  "backpacksCount": 4,
  "pickaxesCount": 3,
  "dancesCount": 3,
  "glidersCount": 4,
  "exclusivesCount": 4,
  "competitiveCount": 1,
  "skins": ["Katalina", "Trailblazer", "First Order Stormtrooper"],
  "imageUrl": "https://your-image-host.example/locker-card.png",
  "verified": true
}
```

The `imageUrl` field is the visual locker card shown below the embed. The included screenshots are references, not account data; use a real image URL or your own hosted card for each account.

`verified: true` controls the screenshot-style verification label. It is stock metadata only; this standalone bot does not call Epic Games or perform Device Auth itself.

## Discord permissions and intents

Enable these bot intents in the Developer Portal:

- Server Members Intent
- Message Content Intent is not required by this slash-command bot

Recommended permissions:

- View Channels
- Send Messages
- Embed Links
- Attach Files
- Use Application Commands

## Storage

The bot uses a local SQLite database at `bot.db`. It is created automatically on first start and ignored by Git. Do not commit real account credentials or `.env` to GitHub.