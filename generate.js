import {
  SlashCommandBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  MessageFlags,
} from "discord.js";
import {
  addClaim,
  getCooldown,
  getSettings,
  hasPremium,
  popAccount,
  setCooldown,
} from "./db.js";
import {
  buildAccountEmbed,
  createLockerCard,
  isAdmin,
  pagerRow,
  totalPages,
} from "./utils.js";

export const data = new SlashCommandBuilder()
  .setName("generate")
  .setDescription("Generate a free or premium account with verification")
  .addStringOption((option) =>
    option
      .setName("category")
      .setDescription("Account category")
      .setRequired(true)
      .addChoices(
        { name: "Free", value: "free" },
        { name: "Premium", value: "premium" }
      )
  );

export async function execute(interaction) {
  const tier = interaction.options.getString("category");
  const settings = getSettings(interaction.guildId);
  const configuredChannel =
    tier === "premium"
      ? settings.premium_channel_id
      : settings.free_channel_id;

  if (
    configuredChannel &&
    interaction.channelId !== configuredChannel &&
    !isAdmin(interaction)
  ) {
    return interaction.reply({
      content: `❌ Use this command in <#${configuredChannel}>.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  if (tier === "premium" && !hasPremium(interaction.user.id, interaction.guildId)) {
    return interaction.reply({
      content: "❌ You need an active Premium subscription to use Premium generation.",
      flags: MessageFlags.Ephemeral,
    });
  }

  const remaining = getCooldown(
    interaction.user.id,
    interaction.guildId,
    tier
  );
  if (remaining > 0) {
    return interaction.reply({
      content: `⏱️ Please wait **${remaining}s** before generating another ${tier} account.`,
      flags: MessageFlags.Ephemeral,
    });
  }

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });
  const account = popAccount(tier);
  if (!account) {
    return interaction.editReply({
      content: `❌ There are no **${tier}** accounts in stock right now.`,
    });
  }

  const cooldown =
    tier === "premium" ? settings.cooldown_premium : settings.cooldown_free;
  setCooldown(interaction.user.id, interaction.guildId, tier, cooldown);
  addClaim(interaction.user.id, interaction.guildId, account.id, tier);

  try {
    const dm = await interaction.user.createDM();
    const pages = totalPages(account);
    const dmCard = createLockerCard(account);
    const message = await dm.send({
      embeds: [
        buildAccountEmbed(
          account,
          settings,
          0,
          false,
          "",
          `attachment://${dmCard.name}`
        ),
      ],
      components: [pagerRow(account.id, 0, pages)],
      files: [dmCard],
    });

    const collector = message.createMessageComponentCollector({
      time: 900_000,
    });
    collector.on("collect", async (button) => {
      if (button.user.id !== interaction.user.id) {
        return button.reply({
          content: "This account belongs to another user.",
          flags: MessageFlags.Ephemeral,
        });
      }
      const [action, , id, rawPage] = button.customId.split("_");
      if (action !== "fortnite") return;
      const page = Number(rawPage ?? 0);
      if (button.customId.startsWith("fortnite_close_")) {
        return button.update({ content: "Account details closed.", embeds: [], components: [] });
      }
      const nextPage = button.customId.includes("_next_")
        ? Math.min(pages - 1, page + 1)
        : Math.max(0, page - 1);
      if (id !== String(account.id)) return;
      await button.update({
        embeds: [buildAccountEmbed(account, settings, nextPage)],
        components: [pagerRow(account.id, nextPage, pages)],
      });
    });

    const publicCard = createLockerCard(account);
    const publicEmbed = buildAccountEmbed(
      account,
      settings,
      0,
      true,
      `<@${interaction.user.id}>`,
      `attachment://${publicCard.name}`
    );
    const logChannel = settings.log_channel_id
      ? await interaction.guild.channels.fetch(settings.log_channel_id).catch(() => null)
      : null;
    const publicChannel = logChannel ?? interaction.channel;
    if (publicChannel?.isTextBased()) {
      await publicChannel.send({ embeds: [publicEmbed], files: [publicCard] });
    }

    await interaction.editReply({
      content: "✅ Account claimed! Details sent via DM.",
    });
  } catch {
    await interaction.editReply({
      content: "❌ I couldn't DM you. Enable server DMs and try again.",
    });
  }
}