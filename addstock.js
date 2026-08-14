import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { addAccount, getStockCount } from "./db.js";
import { isAdmin, parseAccountInput, parseLines } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("addstock")
  .setDescription("Add accounts to stock (one by one or via file)")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Stock category")
      .setRequired(true)
      .addChoices(
        { name: "Free", value: "free" },
        { name: "Premium", value: "premium" }
      )
  )
  .addAttachmentOption((option) =>
    option
      .setName("file")
      .setDescription("Optional TXT file (one email:password per line)")
      .setRequired(false)
  );

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const tier = interaction.options.getString("category");
  const file = interaction.options.getAttachment("file");

  // If file is provided, process it
  if (file) {
    if (!file.name.toLowerCase().endsWith(".txt")) {
      return interaction.reply({
        content: "❌ Please upload a `.txt` file.",
        flags: MessageFlags.Ephemeral,
      });
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    try {
      const response = await fetch(file.url);
      const text = await response.text();
      const accounts = parseLines(text, tier);

      if (accounts.length === 0) {
        return interaction.editReply({
          content: "❌ No valid accounts found in file. Use format: `email:password` (one per line).",
        });
      }

      for (const account of accounts) addAccount(account);

      await interaction.editReply({
        content: `✅ Uploaded **${accounts.length}** ${tier} account(s). Stock: **${getStockCount(tier)}**.`,
      });
    } catch (error) {
      await interaction.editReply({
        content: "❌ I couldn't read that file. Use one `email:password` account per line.",
      });
    }
    return;
  }

  // Otherwise, show modal for manual entry
  const modal = new ModalBuilder()
    .setCustomId(`addstock_${tier}`)
    .setTitle(`Add ${tier} account`);
  const input = new TextInputBuilder()
    .setCustomId("account")
    .setLabel("Account JSON or email:password")
    .setStyle(TextInputStyle.Paragraph)
    .setPlaceholder(
      '{\"email\":\"...\",\"password\":\"...\",\"displayName\":\"...\",\"skins\":[...]}'
    )
    .setRequired(true);
  modal.addComponents(new ActionRowBuilder().addComponents(input));
  await interaction.showModal(modal);

  let submitted;
  try {
    submitted = await interaction.awaitModalSubmit({ time: 300_000 });
  } catch {
    return;
  }

  const account = parseAccountInput(
    submitted.fields.getTextInputValue("account"),
    tier
  );
  if (!account) {
    return submitted.reply({
      content: "❌ Invalid account. Use JSON or `email:password`.",
      flags: MessageFlags.Ephemeral,
    });
  }

  addAccount(account);
  await submitted.reply({
    content: `✅ Added 1 **${tier}** account. Stock: **${getStockCount(tier)}**.`,
    flags: MessageFlags.Ephemeral,
  });
}

