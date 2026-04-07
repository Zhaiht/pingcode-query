import "dotenv/config";

const BASE_URL = process.env.PINGCODE_BASE_URL;
const CLIENT_ID = process.env.PINGCODE_CLIENT_ID;
const CLIENT_SECRET = process.env.PINGCODE_CLIENT_SECRET;

if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("请先在 .env 文件中配置 PINGCODE_BASE_URL, PINGCODE_CLIENT_ID, PINGCODE_CLIENT_SECRET");
  process.exit(1);
}

const params = new URLSearchParams({
  grant_type: "client_credentials",
  client_id: CLIENT_ID,
  client_secret: CLIENT_SECRET,
});

const url = `${BASE_URL}/v1/auth/token?${params}`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`获取 token 失败: ${res.status} ${await res.text()}`);
  process.exit(1);
}

const data = await res.json();
console.log("\n获取 token 成功:\n");
console.log(JSON.stringify(data, null, 2));
console.log(`\n请将 access_token 填入 .env 文件的 PINGCODE_API_TOKEN 中`);
