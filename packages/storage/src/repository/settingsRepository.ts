import type { Database as DB } from "better-sqlite3";

export interface SystemSettings {
  siteName: string;
  logoPath: string;
  primaryColor: string;
  requireApproval: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
  siteName: "SkillOS Admin",
  logoPath: "",
  primaryColor: "#d97706",
  requireApproval: false,
};

export class SettingsRepository {
  constructor(private readonly db: DB) {}

  getSettings(): SystemSettings {
    const rows = this.db.prepare("SELECT key, value FROM system_settings").all() as {
      key: keyof SystemSettings;
      value: string;
    }[];
    const settings = { ...DEFAULT_SETTINGS };
    for (const row of rows) {
      if (row.key === "requireApproval") {
        settings.requireApproval = row.value === "true";
      } else if (row.key === "siteName") {
        settings.siteName = row.value;
      } else if (row.key === "logoPath") {
        settings.logoPath = row.value;
      } else if (row.key === "primaryColor") {
        settings.primaryColor = row.value;
      }
    }
    return settings;
  }

  updateSettings(input: Partial<SystemSettings>): SystemSettings {
    const now = new Date().toISOString();
    const stmt = this.db.prepare(
      `INSERT INTO system_settings (key, value, updated_at)
       VALUES (?, ?, ?)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at`
    );
    const save = this.db.transaction((settings: Partial<SystemSettings>) => {
      for (const [key, value] of Object.entries(settings)) {
        if (!(key in DEFAULT_SETTINGS) || value == null) continue;
        stmt.run(key, String(value), now);
      }
    });
    save(input);
    return this.getSettings();
  }
}
