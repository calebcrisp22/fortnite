import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { setSetting } from "./db.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("setcooldown")
  .setDescription("Set cooldown for free or premium generation")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Generation category")
      .setRequired(true)
      .addChoices(
        { name: "Free", value: "cooldown_free" },
        { name: "Premium", value: "cooldown_premium" }
      )
  )
  .addIntegerOption((option) =>
    option
      .setName("seconds")
      .setDescription("Cooldown in seconds")
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(86400)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const key = interaction.options.getString("category");
  const seconds = interaction.options.getInteger("seconds");
  setSetting(interaction.guildId, key, seconds);
  await interaction.reply({
    content: `✅ ${key === "cooldown_free" ? "Free" : "Premium"} cooldown set to **${seconds}s**.`,
    flags: MessageFlags.Ephemeral,
  });
}