import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { grantPremium } from "../db.js";
import { buildPremiumEmbed, isAdmin, parseDurationDays } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("givepremium")
  .setDescription("Give premium access to a user for X days")
  .addUserOption((option) =>
    option.setName("user").setDescription("User to grant access to").setRequired(true)
  )
  .addIntegerOption((option) =>
    option
      .setName("days")
      .setDescription("Number of days")
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(3650)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const user = interaction.options.getUser("user");
  const days = parseDurationDays(interaction.options.getInteger("days"));
  if (!days) {
    return interaction.reply({
      content: "❌ Enter a valid number of days.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const expiresAt = grantPremium(
    user.id,
    interaction.guildId,
    days,
    interaction.user.username
  );
  try {
    await user.send({
      embeds: [buildPremiumEmbed(days, interaction.user.username)],
    });
  } catch {
    // The access is granted even when the user's DMs are closed.
  }
  await interaction.reply({
    content: `✅ Premium access granted to ${user} until <t:${expiresAt}:F>.`,
    flags: MessageFlags.Ephemeral,
  });
}