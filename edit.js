import {
  SlashCommandBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  ActionRowBuilder,
  MessageFlags,
} from "discord.js";
import { getSettings, setSetting } from "./db.js";
import { isAdmin } from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("edit")
  .setDescription("Customize embed appearance");

export async function execute(interaction) {
  if (!isAdmin(interaction)) {
    return interaction.reply({
      content: "❌ Admin permission required.",
      flags: MessageFlags.Ephemeral,
    });
  }
  const settings = getSettings(interaction.guildId);
  const modal = new ModalBuilder().setCustomId("edit_embed").setTitle("Edit embed appearance");
  const color = new TextInputBuilder()
    .setCustomId("color")
    .setLabel("Accent color (#RRGGBB)")
    .setStyle(TextInputStyle.Short)
    .setValue(settings.embed_color)
    .setRequired(true);
  const title = new TextInputBuilder()
    .setCustomId("title")
    .setLabel("Embed title")
    .setStyle(TextInputStyle.Short)
    .setValue(settings.embed_title)
    .setRequired(true);
  const footer = new TextInputBuilder()
    .setCustomId("footer")
    .setLabel("Footer text")
    .setStyle(TextInputStyle.Short)
    .setValue(settings.footer_text)
    .setRequired(true);
  modal.addComponents(
    new ActionRowBuilder().addComponents(color),
    new ActionRowBuilder().addComponents(title),
    new ActionRowBuilder().addComponents(footer)
  );
  await interaction.showModal(modal);
  let submitted;
  try {
    submitted = await interaction.awaitModalSubmit({ time: 300_000 });
  } catch {
    return;
  }
  const nextColor = submitted.fields.getTextInputValue("color");
  if (!/^#[0-9a-f]{6}$/i.test(nextColor)) {
    return submitted.reply({
      content: "❌ Color must look like `#6d5dfc`.",
      flags: MessageFlags.Ephemeral,
    });
  }
  setSetting(interaction.guildId, "embed_color", nextColor);
  setSetting(interaction.guildId, "embed_title", submitted.fields.getTextInputValue("title"));
  setSetting(interaction.guildId, "footer_text", submitted.fields.getTextInputValue("footer"));
  await submitted.reply({
    content: "✅ Embed appearance updated.",
    flags: MessageFlags.Ephemeral,
  });
}