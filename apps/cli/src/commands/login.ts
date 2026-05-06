import prompts from 'prompts';
import axios from 'axios';
import fs from 'fs';
import path from 'path';

export async function loginCommand() {
  const { username, password } = await prompts([
    { type: 'text', name: 'username', message: 'Username:' },
    { type: 'password', name: 'password', message: 'Password:' }
  ]);
  try {
    const res = await axios.post('http://localhost:3000/login', { username, password });
    const token = res.data.token || '';
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
