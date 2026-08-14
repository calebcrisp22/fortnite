import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { setSetting } from "./db.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("setadminrole")
  .setDescription("Set the admin role name")
  .addRoleOption((option) =>
    option.setName("role").setDescription("Role allowed to manage the bot").setRequired(true)
  );

export async function execute(interaction) {
  if (!interaction.member?.permissions?.has("Administrator")) {
    return interaction.reply({
      content: "❌ Only a Discord Administrator can change the admin role.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const role = interaction.options.getRole("role");
  setSetting(interaction.guildId, "admin_role_name", role.name);
  await interaction.reply({
    content: `✅ Bot admin role set to **${role.name}**.`,
    flags: MessageFlags.Ephemeral,
  });
}