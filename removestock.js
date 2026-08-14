import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { deleteAccountByEmail } from "./db.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("removestock")
  .setDescription("Remove a specific account by email")
  .addStringOption((option) =>
    option
      .setName("email")
      .setDescription("Email address to remove")
      .setRequired(true)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const email = interaction.options.getString("email").trim();
  const result = deleteAccountByEmail(email);
  await interaction.reply({
    content: result.changes
      ? `✅ Removed the unused account for \`${email}\`.`
      : `❌ No unused account found for \`${email}\`.`,
    flags: MessageFlags.Ephemeral,
  });
}