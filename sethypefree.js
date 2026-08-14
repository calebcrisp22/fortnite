import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("sethypefree")
  .setDescription("(Deprecated) Set free hype channel");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  await interaction.reply({
    content: "ℹ️ `/sethypefree` is deprecated. Use `/setchannel` or `/setlogchannel`.",
    flags: MessageFlags.Ephemeral,
  });
}