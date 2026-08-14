import { SlashCommandBuilder, EmbedBuilder, MessageFlags } from "discord.js";
import { getStockCount } from "./db.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("stock")
  .setDescription("Check current stock levels (admin)");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const embed = new EmbedBuilder()
    .setColor("#6d5dfc")
    .setTitle("📦 Current Stock")
    .addFields(
      { name: "Free accounts", value: `**${getStockCount("free")}**`, inline: true },
      { name: "Premium accounts", value: `**${getStockCount("premium")}**`, inline: true }
    )
    .setTimestamp();
  await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
}