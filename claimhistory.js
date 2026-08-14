import { SlashCommandBuilder, EmbedBuilder } from "discord.js";
import { getClaimHistory } from "./db.js";

export const data = new SlashCommandBuilder()
  .setName("claimhistory")
  .setDescription("Check your claim history");

export async function execute(interaction) {
  const claims = getClaimHistory(interaction.user.id, interaction.guildId);
  const description =
    claims.length === 0
      ? "You have not claimed an account yet."
      : claims
          .map(
            (claim) =>
              `**${claim.tier.toUpperCase()}** — ${claim.display_name ?? "Unnamed"} — <t:${claim.claimed_at}:R>`
          )
          .join("\n");
  const embed = new EmbedBuilder()
    .setColor("#6d5dfc")
    .setTitle("📜 Claim History")
    .setDescription(description)
    .setFooter({ text: `${claims.length} recent claim(s)` })
    .setTimestamp();
  await interaction.reply({ embeds: [embed], ephemeral: true });
}