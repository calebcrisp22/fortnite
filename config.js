import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getSettings } from "./db.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("config")
  .setDescription("Show current bot configuration");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const settings = getSettings(interaction.guildId);
  const embed = new EmbedBuilder()
    .setColor(settings.embed_color)
    .setTitle("⚙️ Fortnite Bot Configuration")
    .addFields(
      {
        name: "Free generation channel",
        value: settings.free_channel_id ? `<#${settings.free_channel_id}>` : "Not set",
        inline: true,
      },
      {
        name: "Premium generation channel",
        value: settings.premium_channel_id ? `<#${settings.premium_channel_id}>` : "Not set",
        inline: true,
      },
      {
        name: "Log channel",
        value: settings.log_channel_id ? `<#${settings.log_channel_id}>` : "Not set",
        inline: true,
      },
      { name: "Free cooldown", value: `${settings.cooldown_free}s`, inline: true },
      { name: "Premium cooldown", value: `${settings.cooldown_premium}s`, inline: true },
      { name: "Admin role", value: settings.admin_role_name ?? "Discord Administrator", inline: true },
      { name: "Hype messages", value: settings.hype_enabled ? "Enabled" : "Disabled", inline: true },
      { name: "Embed title", value: settings.embed_title, inline: true },
      { name: "Embed footer", value: settings.footer_text, inline: true }
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}