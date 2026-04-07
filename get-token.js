import "dotenv/config";
import { readFileSync, writeFileSync } from "node:fs";

const BASE_URL = process.env.PINGCODE_BASE_URL;
const CLIENT_ID = process.env.PINGCODE_CLIENT_ID;
const CLIENT_SECRET = process.env.PINGCODE_CLIENT_SECRET;

if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("请先在 .env 文件中配置 PINGCODE_BASE_URL, PINGCODE_CLIENT_ID, PINGCODE_CLIENT_SECRET");
  process.exit(1);
}

function isTokenExpired() {
  const expiry = process.env.PINGCODE_TOKEN_EXPIRY;
  if (!process.env.PINGCODE_API_TOKEN || !expiry) return true;
  // 提前 60 秒刷新
  return Date.now() >= (Number(expiry) - 60) * 1000;
}

function updateEnv(token, expiresAt) {
  let content = readFileSync(".env", "utf-8");

  if (/^PINGCODE_API_TOKEN=/m.test(content)) {
    content = content.replace(/^PINGCODE_API_TOKEN=.*/m, `PINGCODE_API_TOKEN=${token}`);
  } else {
    content += `\nPINGCODE_API_TOKEN=${token}`;
  }

  if (/^PINGCODE_TOKEN_EXPIRY=/m.test(content)) {
    content = content.replace(/^PINGCODE_TOKEN_EXPIRY=.*/m, `PINGCODE_TOKEN_EXPIRY=${expiresAt}`);
  } else {
    content += `\nPINGCODE_TOKEN_EXPIRY=${expiresAt}`;
  }

  writeFileSync(".env", content, "utf-8");
}

async function fetchToken() {
  const params = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const res = await fetch(`${BASE_URL}/v1/auth/token?${params}`);
  if (!res.ok) {
    console.error(`获取 token 失败: ${res.status} ${await res.text()}`);
    process.exit(1);
  }

  const data = await res.json();
  const expiresAt = Math.floor(Date.now() / 1000) + (data.expires_in || 7200);
  updateEnv(data.access_token, expiresAt);

  console.log(`token 已更新，有效期至: ${new Date(expiresAt * 1000).toLocaleString("zh-CN")}`);
  return data.access_token;
}

if (isTokenExpired()) {
  console.log("token 不存在或已过期，正在获取新 token...");
  await fetchToken();
} else {
  const expiry = new Date(Number(process.env.PINGCODE_TOKEN_EXPIRY) * 1000).toLocaleString("zh-CN");
  console.log(`token 有效，无需刷新（有效期至: ${expiry}）`);
}
