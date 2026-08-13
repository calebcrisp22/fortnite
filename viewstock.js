import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getStockCount } from "../db.js";

export const data = new SlashCommandBuilder()
  .setName("viewstock")
  .setDescription("Check current stock levels (free and premium)");

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor("#6d5dfc")
    .setTitle("🎮 Fortnite Stock")
    .setDescription("Current account availability")
    .addFields(
      { name: "🟢 Free", value: `**${getStockCount("free")}** accounts`, inline: true },
      { name: "💎 Premium", value: `**${getStockCount("premium")}** accounts`, inline: true }
    )
    .setFooter({ text: "Use /generate to claim an account" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}