import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { setSetting } from "./db.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("togglehype")
  .setDescription("(Deprecated) Toggle hype messages")
  .addBooleanOption((option) =>
    option.setName("enabled").setDescription("Enable hype messages").setRequired(true)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const enabled = interaction.options.getBoolean("enabled");
  setSetting(interaction.guildId, "hype_enabled", enabled ? 1 : 0);
  await interaction.reply({
    content: `ℹ️ Hype messages are ${enabled ? "enabled" : "disabled"}. This legacy setting is kept for compatibility.`,
    flags: MessageFlags.Ephemeral,
  });
}