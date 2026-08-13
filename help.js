import { SlashCommandBuilder, EmbedBuilder } from "discord.js";

export const data = new SlashCommandBuilder()
  .setName("help")
  .setDescription("Show all available commands");

const commands = [
  ["generate", "Generate a free or premium account with verification"],
  ["addstock", "Add accounts to stock (one by one)"],
  ["claimhistory", "Check your claim history"],
  ["clearstock", "Remove ALL accounts of a tier"],
  ["config", "Show current bot configuration"],
  ["edit", "Customize embed appearance"],
  ["givepremium", "Give premium access to a user for X days"],
  ["help", "Show all available commands"],
  ["removestock", "Remove a specific account by email"],
  ["setadminrole", "Set the admin role name"],
  ["setchannel", "Set the channel for free or premium generation"],
  ["setcooldown", "Set cooldown for free or premium generation"],
  ["sethypefree", "Deprecated: set free hype channel"],
  ["sethypremium", "Deprecated: set premium hype channel"],
  ["setlogchannel", "Set channel for generation logs"],
  ["stock", "Check current stock levels (admin)"],
  ["sync", "Force sync slash commands globally (admin only)"],
  ["togglehype", "Deprecated: toggle hype messages"],
  ["uploadstock", "Upload a .txt file with accounts"],
  ["viewstock", "Check current stock levels"],
];

export async function execute(interaction) {
  const embed = new EmbedBuilder()
    .setColor("#6d5dfc")
    .setTitle("Fortnite — All Commands")
    .setDescription(
      commands
        .map(([name, description]) => `**/${name}** — ${description}`)
        .join("\n")
    )
    .setFooter({ text: "Fortnite Gen • Use /generate to claim an account" })
    .setTimestamp();
  await interaction.reply({ embeds: [embed] });
}