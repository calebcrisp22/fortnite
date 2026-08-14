import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import { clearStock, getStockCount } from "./db.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("clearstock")
  .setDescription("Remove ALL accounts of a tier (free or premium)")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Stock category")
      .setRequired(true)
      .addChoices(
        { name: "Free", value: "free" },
        { name: "Premium", value: "premium" }
      )
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const tier = interaction.options.getString("category");
  const count = getStockCount(tier);
  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`clear_${tier}`)
      .setLabel(`Clear ${count} accounts`)
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("clear_cancel")
      .setLabel("Cancel")
      .setStyle(ButtonStyle.Secondary)
  );
  await interaction.reply({
    content: `⚠️ This removes **all ${count} unused ${tier} accounts**. Continue?`,
    components: [row],
    flags: MessageFlags.Ephemeral,
  });
  const reply = await interaction.fetchReply();
  let button;
  try {
    button = await reply.awaitMessageComponent({ time: 30_000 });
  } catch {
    return interaction.editReply({ content: "Timed out.", components: [] });
  }
  if (button.customId === "clear_cancel") {
    return button.update({ content: "Cancelled.", components: [] });
  }
  const result = clearStock(tier);
  await button.update({
    content: `✅ Removed **${result.changes}** ${tier} account(s).`,
    components: [],
  });
}