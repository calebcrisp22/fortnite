import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { setSetting } from "../db.js";
import { isAdmin } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("setlogchannel")
  .setDescription("Set channel for generation logs")
  .addChannelOption((option) =>
    option.setName("channel").setDescription("Log channel").setRequired(true)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const channel = interaction.options.getChannel("channel");
  setSetting(interaction.guildId, "log_channel_id", channel.id);
  await interaction.reply({
    content: `✅ Generation log channel set to ${channel}.`,
    flags: MessageFlags.Ephemeral,
  });
}