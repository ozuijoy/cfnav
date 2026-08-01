/**
 * ==========================================
 * Cloudflare Pages Functions 後端 API 處理
 * 路由: /api/config
 * 優化：將預設配置從config中分離獨立為defaultData.js
 * ==========================================
 */

import { defaultData } from './defaultData.js';

const CONFIG = {
  bingApi: "https://www.bing.com/HPImageArchive.aspx?format=js&idx=0&n=1"
};

function formatCNTime(date) {
  const d = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Shanghai' }));
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

// 動態生成包含最新時間的預設資料
const getFreshDefaultData = () => ({
  ...defaultData,
  lastUpdated: formatCNTime(new Date()) 
});

export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);

  // 0. 核心防崩檢查：確保 KV 已經綁定
  if (!env.page_nav) {
    return new Response(JSON.stringify({ 
      error: "KV_BINDING_MISSING", 
      message: "後端錯誤：未檢測到名為 'page_nav' 的 KV 資料庫綁定。請在 Cloudflare Pages 設定中添加綁定並重新部署。" 
    }), { status: 500, headers: { "Content-Type": "application/json;charset=UTF-8" } });
  }

  const headers = { "Content-Type": "application/json;charset=UTF-8", "Cache-Control": "no-store" };

  try {
    // 1. 處理恢復預設配置 (DELETE)
    if (request.method === "DELETE") {
      const auth = request.headers.get("Authorization");
      if (auth !== env.TOKEN) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      
      const resetData = getFreshDefaultData();
      await env.page_nav.put("config", JSON.stringify(resetData)); 
      return new Response(JSON.stringify({ success: true, message: "已重置為預設配置" }), { headers });
    }

    // 2. 處理儲存資料 (POST)
    if (request.method === "POST") {
      const auth = request.headers.get("Authorization");
      if (auth !== env.TOKEN) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers });
      
      const newData = await request.json();
      newData.lastUpdated = formatCNTime(new Date()); 
      await env.page_nav.put("config", JSON.stringify(newData)); 
      return new Response(JSON.stringify({ success: true }), { headers });
    }

    // 3. 處理獲取資料 (GET)
    if (request.method === "GET") {
      let dataStr = await env.page_nav.get("config");
      let dataObj = JSON.parse(dataStr || JSON.stringify(getFreshDefaultData()));

      const auth = request.headers.get("Authorization") || url.searchParams.get("token");
      const isAdmin = (auth === env.TOKEN);

      if (!isAdmin) {
        dataObj.categories = dataObj.categories.filter(c => !c.hidden);
        dataObj.items = dataObj.items.filter(i => !i.hidden);
      }

      // 【優化】Bing 壁紙的 KV 快取機制 (12小時有效期)
      let bgUrl = "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?q=80&w=1920"; // 預設後備壁紙
      try {
        const cachedBingStr = await env.page_nav.get("bing_cache");
        const now = Date.now();
        let useCache = false;

        if (cachedBingStr) {
          const cachedBing = JSON.parse(cachedBingStr);
          // 如果快取存在且未過期（12小時 = 43200000 毫秒）
          if (cachedBing.url && cachedBing.expiresAt > now) {
            bgUrl = cachedBing.url;
            useCache = true;
          }
        }

        // 如果沒有快取或已過期，則發起真實請求
        if (!useCache) {
          const bingRes = await fetch(CONFIG.bingApi, { cf: { cacheTtl: 3600 } });
          if (bingRes.ok) {
            const bingData = await bingRes.json();
            bgUrl = "https://www.bing.com" + bingData.images[0].url;
            // 將新獲取的 URL 寫入 KV 快取
            await env.page_nav.put("bing_cache", JSON.stringify({ url: bgUrl, expiresAt: now + 43200000 }));
          }
        }
      } catch (e) {
        console.log("Bing 壁紙獲取或快取寫入失敗", e);
      }

      return new Response(JSON.stringify({ ...dataObj, bgUrl, isAdmin }), { headers });
    }

    return new Response(JSON.stringify({ error: "Method Not Allowed" }), { status: 405, headers });

  } catch (err) {
    return new Response(JSON.stringify({ error: "SERVER_ERROR", message: err.toString() }), { status: 500, headers });
  }
}
