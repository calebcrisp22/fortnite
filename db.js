import Database from "better-sqlite3";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const db = new Database(join(__dirname, "../bot.db"));
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS stock (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    credentials TEXT NOT NULL,
    username TEXT,
    linked_platforms TEXT,
    tier TEXT NOT NULL DEFAULT 'free',
    is_used INTEGER NOT NULL DEFAULT 0,
    added_at INTEGER NOT NULL DEFAULT (unixepoch())
  );

  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    expires_at INTEGER NOT NULL,
    granted_by TEXT NOT NULL,
    created_at INTEGER NOT NULL DEFAULT (unixepoch()),
    UNIQUE(user_id, guild_id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    guild_id TEXT PRIMARY KEY,
    free_channel_id TEXT,
    premium_channel_id TEXT,
    log_channel_id TEXT,
    cooldown_free INTEGER NOT NULL DEFAULT 30,
    cooldown_premium INTEGER NOT NULL DEFAULT 60,
    admin_role_name TEXT,
    hype_enabled INTEGER NOT NULL DEFAULT 0,
    embed_color TEXT NOT NULL DEFAULT '#6d5dfc',
    embed_title TEXT NOT NULL DEFAULT 'Fortnite',
    footer_text TEXT NOT NULL DEFAULT 'Fortnite Gen'
  );

  CREATE TABLE IF NOT EXISTS claims (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    guild_id TEXT NOT NULL,
    account_id INTEGER NOT NULL,
    tier TEXT NOT NULL,
    claimed_at INTEGER NOT NULL DEFAULT (unixepoch())
  );
`);

const columns = {
  display_name: "TEXT",
  account_id: "TEXT",
  email: "TEXT",
  password: "TEXT",
  skins_count: "INTEGER DEFAULT 0",
  backpacks_count: "INTEGER DEFAULT 0",
  pickaxes_count: "INTEGER DEFAULT 0",
  dances_count: "INTEGER DEFAULT 0",
  gliders_count: "INTEGER DEFAULT 0",
  exclusives_count: "INTEGER DEFAULT 0",
  competitive_count: "INTEGER DEFAULT 0",
  skins: "TEXT",
  image_url: "TEXT",
  verified: "INTEGER DEFAULT 1",
};
const existing = new Set(
  db.prepare("PRAGMA table_info(stock)").all().map((column) => column.name)
);
for (const [name, definition] of Object.entries(columns)) {
  if (!existing.has(name)) db.exec(`ALTER TABLE stock ADD COLUMN ${name} ${definition}`);
}

const settingsColumns = new Set(
  db.prepare("PRAGMA table_info(settings)").all().map((column) => column.name)
);
const missingSettingsColumns = {
  free_channel_id: "TEXT",
  premium_channel_id: "TEXT",
  log_channel_id: "TEXT",
  cooldown_free: "INTEGER NOT NULL DEFAULT 30",
  cooldown_premium: "INTEGER NOT NULL DEFAULT 60",
  admin_role_name: "TEXT",
  hype_enabled: "INTEGER NOT NULL DEFAULT 0",
  embed_color: "TEXT NOT NULL DEFAULT '#6d5dfc'",
  embed_title: "TEXT NOT NULL DEFAULT 'Fortnite'",
  footer_text: "TEXT NOT NULL DEFAULT 'Fortnite Gen'",
};
for (const [name, definition] of Object.entries(missingSettingsColumns)) {
  if (!settingsColumns.has(name)) {
    db.exec(`ALTER TABLE settings ADD COLUMN ${name} ${definition}`);
  }
}

const DEFAULT_SETTINGS = {
  guild_id: "",
  free_channel_id: null,
  premium_channel_id: null,
  log_channel_id: null,
  cooldown_free: 30,
  cooldown_premium: 60,
  admin_role_name: null,
  hype_enabled: 0,
  embed_color: "#6d5dfc",
  embed_title: "Fortnite",
  footer_text: "Fortnite Gen",
};

export function getSettings(guildId) {
  return (
    db.prepare("SELECT * FROM settings WHERE guild_id = ?").get(guildId) ?? {
      ...DEFAULT_SETTINGS,
      guild_id: guildId,
    }
  );
}

export function setSetting(guildId, key, value) {
  const allowed = new Set([
    "free_channel_id",
    "premium_channel_id",
    "log_channel_id",
    "cooldown_free",
    "cooldown_premium",
    "admin_role_name",
    "hype_enabled",
    "embed_color",
    "embed_title",
    "footer_text",
  ]);
  if (!allowed.has(key)) throw new Error(`Unknown setting: ${key}`);
  db.prepare(`
    INSERT INTO settings (guild_id, ${key}) VALUES (?, ?)
    ON CONFLICT(guild_id) DO UPDATE SET ${key} = excluded.${key}
  `).run(guildId, value);
}

export function getStockCount(tier) {
  return db
    .prepare("SELECT COUNT(*) AS count FROM stock WHERE tier = ? AND is_used = 0")
    .get(tier).count;
}

export function addAccount(input) {
  const credential = input.credentials ?? `${input.email}:${input.password}`;
  const email = input.email ?? credential.split(":")[0];
  const password = input.password ?? credential.slice(email.length + 1);
  const skins = Array.isArray(input.skins)
    ? input.skins
    : Array.isArray(input.cosmetics)
      ? input.cosmetics
      : [];
  const locker = input.locker ?? {};
  const value = (key, fallback = 0) =>
    input[key] ?? locker[key] ?? fallback;

  return db
    .prepare(`
      INSERT INTO stock
        (credentials, email, password, display_name, account_id,
         linked_platforms, skins_count, backpacks_count, pickaxes_count,
         dances_count, gliders_count, exclusives_count, competitive_count,
         skins, image_url, verified, tier)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .run(
      credential,
      email,
      password,
      input.displayName ?? input.display_name ?? input.username ?? null,
      input.accountId ?? input.account_id ?? null,
      JSON.stringify(input.linkedPlatforms ?? input.linked_platforms ?? []),
      value("skinsCount", value("skins_count", skins.length)),
      value("backpacksCount", value("backpacks_count")),
      value("pickaxesCount", value("pickaxes_count")),
      value("dancesCount", value("dances_count")),
      value("glidersCount", value("gliders_count")),
      value("exclusivesCount", value("exclusives_count")),
      value("competitiveCount", value("competitive_count")),
      JSON.stringify(skins),
      input.imageUrl ?? input.image_url ?? null,
      input.verified === true ? 1 : 0,
      input.tier ?? "free"
    );
}

export function parseAccountRow(row) {
  return {
    ...row,
    skins: parseJson(row.skins, []),
    linkedPlatforms: parseJson(row.linked_platforms, []),
    verified: Boolean(row.verified),
  };
}

function parseJson(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function popAccount(tier) {
  const row = db
    .prepare(
      "SELECT * FROM stock WHERE tier = ? AND is_used = 0 ORDER BY id ASC LIMIT 1"
    )
    .get(tier);
  if (!row) return null;
  db.prepare("UPDATE stock SET is_used = 1 WHERE id = ?").run(row.id);
  return parseAccountRow(row);
}

export function listAccounts(tier, limit = 25) {
  return db
    .prepare(
      "SELECT * FROM stock WHERE tier = ? AND is_used = 0 ORDER BY id ASC LIMIT ?"
    )
    .all(tier, limit)
    .map(parseAccountRow);
}

export function deleteAccountByEmail(email) {
  return db
    .prepare(
      "DELETE FROM stock WHERE id = (SELECT id FROM stock WHERE email = ? AND is_used = 0 ORDER BY id ASC LIMIT 1)"
    )
    .run(email);
}

export function clearStock(tier) {
  return db
    .prepare("DELETE FROM stock WHERE tier = ? AND is_used = 0")
    .run(tier);
}

export function getSubscription(userId, guildId) {
  return db
    .prepare("SELECT * FROM subscriptions WHERE user_id = ? AND guild_id = ?")
    .get(userId, guildId);
}

export function grantPremium(userId, guildId, days, grantedBy) {
  const now = Math.floor(Date.now() / 1000);
  const current = getSubscription(userId, guildId);
  const start = current?.expires_at > now ? current.expires_at : now;
  const expiresAt = start + days * 86400;
  db.prepare(`
    INSERT INTO subscriptions (user_id, guild_id, expires_at, granted_by)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id) DO UPDATE SET
      expires_at = excluded.expires_at,
      granted_by = excluded.granted_by
  `).run(userId, guildId, expiresAt, grantedBy);
  return expiresAt;
}

export function hasPremium(userId, guildId) {
  const sub = getSubscription(userId, guildId);
  return Boolean(sub && sub.expires_at > Math.floor(Date.now() / 1000));
}

export function addClaim(userId, guildId, accountId, tier) {
  db.prepare(
    "INSERT INTO claims (user_id, guild_id, account_id, tier) VALUES (?, ?, ?, ?)"
  ).run(userId, guildId, accountId, tier);
}

export function getClaimHistory(userId, guildId, limit = 10) {
  return db
    .prepare(`
      SELECT claims.*, stock.display_name, stock.email
      FROM claims LEFT JOIN stock ON stock.id = claims.account_id
      WHERE claims.user_id = ? AND claims.guild_id = ?
      ORDER BY claims.id DESC LIMIT ?
    `)
    .all(userId, guildId, limit);
}

export function setCooldown(userId, guildId, tier, seconds) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS cooldowns (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      tier TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, guild_id, tier)
    )
  `).run();
  db.prepare(`
    INSERT INTO cooldowns (user_id, guild_id, tier, expires_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id, guild_id, tier) DO UPDATE SET expires_at = excluded.expires_at
  `).run(userId, guildId, tier, Math.floor(Date.now() / 1000) + seconds);
}

export function getCooldown(userId, guildId, tier) {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS cooldowns (
      user_id TEXT NOT NULL,
      guild_id TEXT NOT NULL,
      tier TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      PRIMARY KEY (user_id, guild_id, tier)
    )
  `).run();
  const row = db
    .prepare(
      "SELECT expires_at FROM cooldowns WHERE user_id = ? AND guild_id = ? AND tier = ?"
    )
    .get(userId, guildId, tier);
  return Math.max(0, (row?.expires_at ?? 0) - Math.floor(Date.now() / 1000));
}

export function getDb() {
  return db;
}

export default db;