import type { FastifyInstance } from "fastify";
import type { SettingsRepository } from "@taoai/skill-storage";

function toCssVariables(settings: { primaryColor?: string; siteName?: string }) {
  const primary = settings.primaryColor || "#d97706";
  // expandable: add more tokens here
  return `:root{--accent:${primary};--accent-soft: ${hexToAlpha(primary, 0.12)};}`;
}

function hexToAlpha(hex: string, alpha: number) {
  // simple hex -> rgba converter for #rrggbb
  const h = hex.replace("#", "");
  if (h.length !== 6) return `rgba(217,119,6,${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function registerThemeRoutes(app: FastifyInstance, settingsRepository: SettingsRepository) {
  app.get("/theme.css", async (req, reply) => {
    const settings = settingsRepository.getSettings();
    const css = toCssVariables(settings);
    reply.type("text/css").send(css);
  });

  app.get("/api/theme", async () => {
    const settings = settingsRepository.getSettings();
    return { theme: { primaryColor: settings.primaryColor, siteName: settings.siteName } };
  });
}

export default registerThemeRoutes;
