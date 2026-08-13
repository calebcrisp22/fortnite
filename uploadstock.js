import { SlashCommandBuilder, MessageFlags } from "discord.js";
import { addAccount, getStockCount } from "../db.js";
import { isAdmin, parseLines } from "../utils.js";

export const data = new SlashCommandBuilder()
  .setName("uploadstock")
  .setDescription("Upload a .txt file with accounts (email:pass per line)")
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
    option.setName("file").setDescription("TXT account file").setRequired(true)
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
    for (const account of accounts) addAccount(account);
    await interaction.editReply({
      content: `✅ Uploaded **${accounts.length}** ${tier} account(s). Stock: **${getStockCount(tier)}**.`,
    });
  } catch {
    await interaction.editReply({
      content: "❌ I couldn't read that file. Use one `email:password` account per line.",
    });
  }
}