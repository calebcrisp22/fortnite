import "dotenv/config";
import { Client, Collection, GatewayIntentBits, Events, REST, Routes } from "discord.js";
import { readdirSync } from "fs";
import { fileURLToPath, pathToFileURL } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── Client Setup ──────────────────────────────────────────────────────────────

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.DirectMessages,
  ],
});

client.commands = new Collection();

(async () => {
  // ── Load Commands ───────────────────────────────────────────────────────────

  const commandsPath = __dirname;
  const nonCommandFiles = ["db.js", "config.js", "utils.js", "deploy-commands.js", "index.js"];
  const commandFiles = readdirSync(commandsPath).filter(
    (f) => f.endsWith(".js") && !nonCommandFiles.includes(f)
  );

  const commands = [];

  for (const file of commandFiles) {
    const filePath = pathToFileURL(join(commandsPath, file)).href;
    const command = await import(filePath);
    if ("data" in command && "execute" in command) {
      client.commands.set(command.data.name, command);
      commands.push(command.data.toJSON());
      console.log(`✅ Loaded command: /${command.data.name}`);
    } else {
      console.warn(`⚠️  Skipping ${file} — missing data or execute export`);
    }
  }

  // ── Deploy Commands to Discord ──────────────────────────────────────────────

  const { DISCORD_BOT_TOKEN, CLIENT_ID, GUILD_ID } = process.env;

  if (!DISCORD_BOT_TOKEN || !CLIENT_ID) {
    console.error("❌ Missing DISCORD_BOT_TOKEN or CLIENT_ID in environment variables!");
    process.exit(1);
  }

  const rest = new REST().setToken(DISCORD_BOT_TOKEN);

  try {
    console.log(`\n🔄 Registering ${commands.length} slash command(s) with Discord...`);

    let data;
    if (GUILD_ID) {
      // Guild commands update instantly — great for testing
      data = await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
        body: commands,
      });
      console.log(`✅ Registered ${data.length} command(s) to guild ${GUILD_ID}\n`);
    } else {
      // Global commands take up to 1 hour to propagate
      data = await rest.put(Routes.applicationCommands(CLIENT_ID), {
        body: commands,
      });
      console.log(`✅ Registered ${data.length} global command(s) — may take up to 1 hour to appear\n`);
    }
  } catch (err) {
    console.error("❌ Failed to register commands:", err);
  }

  // ── Events ──────────────────────────────────────────────────────────────────

  client.once(Events.ClientReady, async (c) => {
    console.log(`🤖 Logged in as ${c.user.tag}`);
    console.log(`📡 Serving ${c.guilds.cache.size} guild(s)\n`);
  });

  // Handle slash commands
  client.on(Events.InteractionCreate, async (interaction) => {
    if (interaction.isChatInputCommand()) {
      const command = client.commands.get(interaction.commandName);
      if (!command) return;

      try {
        await command.execute(interaction);
      } catch (err) {
        console.error(`Error in /${interaction.commandName}:`, err);
        const payload = {
          content: "❌ An error occurred while running this command.",
          flags: 64, // ephemeral
        };
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(payload).catch(() => {});
        } else {
          await interaction.reply(payload).catch(() => {});
        }
      }
    }
  });

  // ── Login ───────────────────────────────────────────────────────────────────

  await client.login(DISCORD_BOT_TOKEN);
})();

