import {
  ActionRowBuilder,
  AttachmentBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
} from "discord.js";
import { getSettings } from "./db.js";

export const FORTNITE_IMAGE =
  "https://images.unsplash.com/photo-1600185365483-26d7a4cc7519?auto=format&fit=crop&w=1200&q=80";

export function isAdmin(interaction) {
  const member = interaction.member;
  if (!member) return false;
  if (member.permissions?.has("Administrator")) return true;
  const configuredRole = getSettings(interaction.guildId).admin_role_name;
  return Boolean(
    configuredRole &&
      member.roles?.cache?.some((role) => role.name === configuredRole)
  );
}

export function parseDurationDays(value) {
  const days = Number(value);
  return Number.isInteger(days) && days > 0 && days <= 3650 ? days : null;
}

export function parseAccountInput(line, tier = "free") {
  const trimmed = line.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      return { ...parsed, tier };
    } catch {
      return null;
    }
  }
  const separator = trimmed.indexOf(":");
  if (separator < 1 || separator === trimmed.length - 1) return null;
  const email = trimmed.slice(0, separator).trim();
  const password = trimmed.slice(separator + 1).trim();
  return {
    email,
    password,
    credentials: `${email}:${password}`,
    displayName: email.split("@")[0],
    accountId: `pending-${Date.now()}-${Math.floor(Math.random() * 9999)}`,
    tier,
    skins: [],
    verified: false,
  };
}

export function parseLines(text, tier) {
  return text
    .split(/\r?\n/)
    .map((line) => parseAccountInput(line, tier))
    .filter(Boolean);
}

export function formatDuration(seconds) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${days}d ${hours}h ${minutes}m`;
}

export function getColor(value) {
  return /^#[0-9a-f]{6}$/i.test(value ?? "") ? value : "#6d5dfc";
}

function platformText(platforms) {
  if (!Array.isArray(platforms) || platforms.length === 0) return "Not listed";
  const icons = {
    xbox: "🟢",
    playstation: "🔵",
    psn: "🔵",
    epic: "⚫",
    nintendo: "🔴",
    twitch: "🟣",
    youtube: "🔴",
  };
  return platforms.map((p) => `${icons[p.toLowerCase()] ?? "🔗"} ${p}`).join(" ");
}

export function lockerLines(account) {
  return [
    `🎁 **Locker Summary**`,
    `🎒 Backpacks: ${account.backpacks_count ?? 0}`,
    `⛏️ Pickaxes: ${account.pickaxes_count ?? 0}`,
    `💃 Dances: ${account.dances_count ?? 0}`,
    `☂️ Gliders: ${account.gliders_count ?? 0}`,
    `✨ Exclusives: ${account.exclusives_count ?? 0}`,
    `🏆 Competitive: ${account.competitive_count ?? 0}`,
  ].join("\n");
}

export function skinPage(account, page = 0) {
  const skins = account.skins ?? [];
  const start = page * 10;
  const pageSkins = skins.slice(start, start + 10);
  if (pageSkins.length === 0) return "No skins on this page.";
  return pageSkins.join("\n");
}

export function totalPages(account) {
  return Math.max(1, Math.ceil((account.skins ?? []).length / 10));
}

export function buildAccountEmbed(
  account,
  settings,
  page = 0,
  publicView = false,
  claimedBy = "",
  imageReference = ""
) {
  const color = getColor(settings.embed_color);
  const title = publicView
    ? `🪐 ${account.tier === "premium" ? "PREMIUM" : "FREE"} Account Claimed!`
    : `${account.tier === "premium" ? "💎 PREMIUM" : "🟢 FREE"} Account Generated!`;
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(
      publicView
        ? `Account claimed by ${claimedBy || "a member"} — details sent via DM.`
        : "Account details are shown below."
    )
    .addFields(
      { name: "🪪 Display Name", value: account.display_name ?? "Not listed", inline: true },
      { name: "🆔 Account ID", value: account.account_id ?? "Not listed", inline: true },
      { name: "🔗 Linkable to", value: platformText(account.linkedPlatforms), inline: false },
      { name: "📊 Locker Summary", value: lockerLines(account), inline: false },
      { name: "🎨 Skins (first 10)", value: skinPage(account, page), inline: false }
    )
    .setFooter({
      text: `Page ${page + 1} of ${totalPages(account)} | ${settings.footer_text ?? "Fortnite Gen"}`,
    })
    .setTimestamp();

  if (!publicView) {
    embed.addFields(
      { name: "📧 Email", value: `\`${account.email ?? "Not listed"}\``, inline: true },
      { name: "🔑 Password", value: `\`${account.password ?? "Not listed"}\``, inline: true },
      {
        name: account.verified
          ? "✅ Verified with Epic Games via Device Auth"
          : "⚠️ Verification status supplied by stock owner",
        value: "Visual card attached below.",
        inline: false,
      }
    );
  } else {
    embed.setAuthor({ name: "Fortnite", iconURL: "https://cdn.discordapp.com/embed/avatars/0.png" });
  }

  embed.setImage(account.image_url || imageReference || FORTNITE_IMAGE);
  return embed;
}

function escapeXml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

export function createLockerCard(account) {
  const skinNames = (account.skins ?? []).slice(0, 3);
  const tiles = skinNames
    .map(
      (skin, index) => `
        <rect x="${20 + index * 132}" y="68" width="120" height="96" rx="3" fill="${["#c99f3b", "#d4d6dc", "#bd3ed3"][index]}" />
        <text x="${28 + index * 132}" y="153" fill="white" font-family="Arial,sans-serif" font-size="11" font-weight="700">${escapeXml(skin).slice(0, 18)}</text>`
    )
    .join("");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="520" height="300" viewBox="0 0 520 300">
      <rect width="520" height="300" rx="14" fill="#17151d"/>
      <rect x="20" y="20" width="82" height="40" rx="3" fill="#47474b"/>
      <text x="28" y="43" fill="#d5d5d8" font-family="Arial,sans-serif" font-size="10">Locker</text>
      <text x="112" y="53" fill="white" font-family="Arial,sans-serif" font-size="46" font-weight="900">${Math.max(1, account.skins_count ?? skinNames.length)}</text>
      <text x="112" y="82" fill="white" font-family="Arial,sans-serif" font-size="25" font-weight="800">Locker</text>
      ${tiles || '<text x="26" y="118" fill="#b8b5c4" font-family="Arial,sans-serif" font-size="16">No skins listed</text>'}
      <rect x="20" y="184" width="480" height="1" fill="#3c3847"/>
      <text x="28" y="218" fill="white" font-family="Arial,sans-serif" font-size="21" font-weight="800">Fortnite Account</text>
      <text x="28" y="246" fill="#bcb7cb" font-family="Arial,sans-serif" font-size="14">${escapeXml(account.display_name || "Generated account")}</text>
      <text x="28" y="272" fill="#79e2a0" font-family="Arial,sans-serif" font-size="13">${account.verified ? "Verified with Epic Games via Device Auth" : "Locker card attached"}</text>
    </svg>`;
  return new AttachmentBuilder(Buffer.from(svg), {
    name: `locker-card-${account.id}.svg`,
  });
}

export function pagerRow(accountId, page, pages) {
  return new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`fortnite_prev_${accountId}_${page}`)
      .setLabel("◀ Previous")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page <= 0),
    new ButtonBuilder()
      .setCustomId(`fortnite_next_${accountId}_${page}`)
      .setLabel("Next ▶")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(page >= pages - 1),
    new ButtonBuilder()
      .setCustomId(`fortnite_close_${accountId}`)
      .setLabel("Close")
      .setStyle(ButtonStyle.Danger)
  );
}

export function buildPremiumEmbed(days, grantedBy) {
  return new EmbedBuilder()
    .setColor("#6d5dfc")
    .setTitle("💎 Premium Access Granted!")
    .setDescription("You now have **Premium** access to the Fortnite generator!")
    .addFields(
      { name: "⏰ Duration", value: `${days} day(s)`, inline: true },
      { name: "📝 How to use", value: "Use `/generate` and choose **Premium**." },
      { name: "🎮 Access", value: "Premium stock and premium generation channel enabled." }
    )
    .setFooter({ text: `Granted by ${grantedBy}` })
    .setTimestamp();
}