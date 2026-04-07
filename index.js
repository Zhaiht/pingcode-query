import "dotenv/config";
import { writeFileSync } from "node:fs";

const BASE_URL = process.env.PINGCODE_BASE_URL;
const CLIENT_ID = process.env.PINGCODE_CLIENT_ID;
const CLIENT_SECRET = process.env.PINGCODE_CLIENT_SECRET;

if (!BASE_URL || !CLIENT_ID || !CLIENT_SECRET) {
  console.error("请先在 .env 文件中配置 PINGCODE_BASE_URL, PINGCODE_CLIENT_ID, PINGCODE_CLIENT_SECRET");
  process.exit(1);
}

async function getToken() {
  const params = new URLSearchParams({ grant_type: "client_credentials", client_id: CLIENT_ID, client_secret: CLIENT_SECRET });
  const res = await fetch(`${BASE_URL}/v1/auth/token?${params}`);
  if (!res.ok) throw new Error(`获取 token 失败: ${res.status} ${await res.text()}`);
  return (await res.json()).access_token;
}

async function api(token, path, params = {}) {
  const qs = new URLSearchParams(params);
  const res = await fetch(`${BASE_URL}/v1${path}?${qs}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`请求失败 ${path}: ${res.status} ${await res.text()}`);
  return res.json();
}

function getLastWeekRange() {
  const now = new Date();
  const dayOfWeek = now.getDay() || 7;
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(now.getDate() - dayOfWeek + 1);
  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(thisMonday.getDate() - 7);
  const lastSunday = new Date(thisMonday);
  lastSunday.setSeconds(lastSunday.getSeconds() - 1);
  return { start: Math.floor(lastMonday.getTime() / 1000), end: Math.floor(lastSunday.getTime() / 1000) };
}

function escapeHtml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtml(lastWeek, completedItems, completedTotal, bugItems, bugTotal) {
  const startDate = new Date(lastWeek.start * 1000).toLocaleDateString("zh-CN");
  const endDate = new Date(lastWeek.end * 1000).toLocaleDateString("zh-CN");

  const itemLink = (item) => item.html_url || (item.short_id ? `https://newtranx.pingcode.com/pjm/workitems/${item.short_id}` : "#");

  const completedRows = completedItems.map((item) => `
    <tr>
      <td><a href="${itemLink(item)}" target="_blank">${escapeHtml(item.identifier)}</a></td>
      <td><a href="${itemLink(item)}" target="_blank">${escapeHtml(item.title)}</a></td>
      <td><span class="badge type-${item.type}">${escapeHtml(item.type)}</span></td>
      <td><span class="badge completed">${escapeHtml(item.state?.name)}</span></td>
      <td>${escapeHtml(item.assignee?.display_name || item.assignee?.name || "-")}</td>
    </tr>`).join("");

  const bugRows = bugItems.map((item) => `
    <tr>
      <td><a href="${itemLink(item)}" target="_blank">${escapeHtml(item.identifier)}</a></td>
      <td><a href="${itemLink(item)}" target="_blank">${escapeHtml(item.title)}</a></td>
      <td><span class="badge priority-${(item.priority?.name || "").replace(/\s/g, "")}">${escapeHtml(item.priority?.name || "-")}</span></td>
      <td><span class="badge pending">${escapeHtml(item.state?.name)}</span></td>
      <td>${escapeHtml(item.assignee?.display_name || item.assignee?.name || "-")}</td>
    </tr>`).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>企业知识管理平台 - 工作项报告</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f5f7fa; color: #333; padding: 24px; }
  .container { max-width: 1200px; margin: 0 auto; }
  h1 { font-size: 24px; margin-bottom: 8px; }
  .subtitle { color: #666; margin-bottom: 32px; font-size: 14px; }
  .section { background: #fff; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.08); margin-bottom: 24px; overflow: hidden; }
  .section-header { padding: 16px 24px; border-bottom: 1px solid #eee; display: flex; align-items: center; gap: 12px; }
  .section-header h2 { font-size: 18px; }
  .count { background: #e8f4fd; color: #1a73e8; padding: 2px 10px; border-radius: 12px; font-size: 13px; font-weight: 600; }
  .count.red { background: #fde8e8; color: #d93025; }
  table { width: 100%; border-collapse: collapse; }
  th { background: #fafbfc; text-align: left; padding: 10px 24px; font-size: 13px; color: #666; font-weight: 600; border-bottom: 1px solid #eee; }
  td { padding: 12px 24px; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
  tr:hover { background: #f8f9fa; }
  a { color: #1a73e8; text-decoration: none; }
  a:hover { text-decoration: underline; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: 500; }
  .completed { background: #e6f4ea; color: #1e8e3e; }
  .pending { background: #fef3e0; color: #e37400; }
  .type-story { background: #e8f0fe; color: #1967d2; }
  .type-task { background: #f3e8fd; color: #8430ce; }
  .type-bug { background: #fde8e8; color: #d93025; }
  .type-epic { background: #e0f7fa; color: #00838f; }
  .type-feature { background: #fff3e0; color: #e65100; }
  .priority-最高 { background: #d93025; color: #fff; }
  .priority-较高 { background: #e37400; color: #fff; }
  .priority-普通 { background: #1a73e8; color: #fff; }
  .priority-较低 { background: #5f6368; color: #fff; }
  .generated { text-align: center; color: #999; font-size: 12px; padding: 16px; }
</style>
</head>
<body>
<div class="container">
  <h1>企业知识管理平台 - 工作项报告</h1>
  <p class="subtitle">生成时间：${new Date().toLocaleString("zh-CN")}</p>

  <div class="section">
    <div class="section-header">
      <h2>✅ 上周已完成的工作项</h2>
      <span class="count">${completedTotal} 条</span>
      <span style="color:#999;font-size:13px">${startDate} ~ ${endDate}</span>
    </div>
    <table>
      <thead><tr><th>编号</th><th>标题</th><th>类型</th><th>状态</th><th>负责人</th></tr></thead>
      <tbody>${completedRows || '<tr><td colspan="5" style="text-align:center;color:#999">暂无数据</td></tr>'}</tbody>
    </table>
  </div>

  <div class="section">
    <div class="section-header">
      <h2>🐛 未处理的缺陷</h2>
      <span class="count red">${bugTotal} 条</span>
      <span style="color:#999;font-size:13px">${startDate} ~ ${endDate}</span>
    </div>
    <table>
      <thead><tr><th>编号</th><th>标题</th><th>优先级</th><th>状态</th><th>负责人</th></tr></thead>
      <tbody>${bugRows || '<tr><td colspan="5" style="text-align:center;color:#999">暂无数据</td></tr>'}</tbody>
    </table>
  </div>

  <p class="generated">由 PingCode Query 自动生成</p>
</div>
</body>
</html>`;
}

async function main() {
  console.log("正在获取 token...");
  const token = await getToken();

  const projectData = await api(token, "/project/projects");
  const target = (projectData.values || []).find((p) => p.name?.includes("企业知识管理平台"));
  if (!target) { console.log('未找到"企业知识管理平台"项目'); return; }
  const projectId = target.id;
  console.log(`项目: ${target.name}`);

  const typeData = await api(token, "/project/work_item/types", { project_id: projectId });
  const types = typeData.values || [];
  const bugType = types.find((t) => t.id === "bug" || t.group === "bug");
  const storyType = types.find((t) => t.id === "story" || t.group === "requirement");

  let completedItems = [], completedTotal = 0;
  const lastWeek = getLastWeekRange();

  if (storyType) {
    const stateData = await api(token, "/project/work_item/states", { project_id: projectId, work_item_type_id: storyType.id });
    const completedIds = (stateData.values || []).filter((s) => s.type === "completed").map((s) => s.id).join(",");
    if (completedIds) {
      const data = await api(token, "/project/work_items", {
        project_ids: projectId, state_ids: completedIds,
        updated_between: `${lastWeek.start},${lastWeek.end}`, page_size: 100,
      });
      completedItems = (data.values || []).filter((i) => {
        const t = i.updated_at || i.completed_at || 0;
        return t >= lastWeek.start && t <= lastWeek.end;
      });
      completedTotal = completedItems.length;
    }
  }

  let bugItems = [], bugTotal = 0;
  if (bugType) {
    const bugStateData = await api(token, "/project/work_item/states", { project_id: projectId, work_item_type_id: bugType.id });
    const pendingIds = (bugStateData.values || []).filter((s) => s.type === "pending").map((s) => s.id).join(",");
    if (pendingIds) {
      const data = await api(token, "/project/work_items", {
        project_ids: projectId, type_ids: bugType.id, state_ids: pendingIds,
        updated_between: `${lastWeek.start},${lastWeek.end}`, page_size: 100,
      });
      bugItems = (data.values || []).filter((i) => {
        const t = i.updated_at || i.created_at || 0;
        return t >= lastWeek.start && t <= lastWeek.end;
      });
      bugTotal = bugItems.length;
    }
  }

  const html = buildHtml(lastWeek, completedItems, completedTotal, bugItems, bugTotal);
  writeFileSync("report.html", html, "utf-8");
  console.log(`\n报告已生成: report.html`);
  console.log(`  上周已完成: ${completedTotal} 条`);
  console.log(`  未处理缺陷: ${bugTotal} 条`);
}

main().catch((err) => { console.error("错误:", err.message); process.exit(1); });
