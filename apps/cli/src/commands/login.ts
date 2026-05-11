import prompts from 'prompts';
import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { loadConfig, saveConfig } from '@skillshub/config';

export async function loginCommand() {
  const { username, password } = await prompts([
    { type: 'text', name: 'username', message: 'Username:' },
    { type: 'password', name: 'password', message: 'Password:' }
  ]);
  try {
    const config = await loadConfig();
    const registry = config.registries.find((item) => item.name === config.defaultRegistry) ?? config.registries[0];
    const baseUrl = (registry?.url ?? 'http://127.0.0.1:7421').replace(/\/+$/, '');
    const res = await axios.post(`${baseUrl}/api/auth/login`, { username, password });
    const token = res.data.token || '';
    if (registry) {
      registry.token = token;
      await saveConfig(config);
    }
    const configPath = path.join(process.env.HOME || '', '.skillsrc');
    fs.writeFileSync(configPath, JSON.stringify({ token }, null, 2));
    console.log('Login successful!');
  } catch (e: any) {
    if (typeof e === 'object' && e && 'response' in e) {
      // @ts-ignore
      console.error('Login failed:', e.response?.data?.error || e.message);
    } else {
      console.error('Login failed:', (e as Error).message);
    }
  }
}
