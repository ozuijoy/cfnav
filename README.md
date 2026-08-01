# 🧭 CfNav - 極簡高效的個人雲端導覽頁


CfNav 是一個基於 **Cloudflare Pages** 和 **Cloudflare KV** 建構的無伺服器（Serverless）個人導覽網站。它擁有極簡的 UI 設計、極致的「秒開」載入體驗，並提供完善的後台管理功能。

真正實現了**前後端分離**，無需購買伺服器或資料庫，利用 Cloudflare 免費額度即可輕鬆部署專屬你的私人書籤頁！

---

## ✨ 核心特性

- 🚀 **極致秒開體驗**：採用 `Stale-while-revalidate` 本地快取優先渲染策略，配合骨架屏（Skeleton Screen）過渡，告別白屏與等待。
- 📱 **PWA 漸進式應用支援**：支援新增到手機桌面，化身獨立 App，斷網也能訪問本地快取。
- 🖼️ **Bing 每日高清壁紙**：自動獲取必應每日壁紙作為背景，後端 12 小時 KV 智能快取，前端透明度動畫平滑淡入，視覺體驗極佳。
- 🖱️ **絲滑的拖曳排序**：無論是在電腦還是手機上，都可以隨意拖曳卡片和分類，調整顯示順序。
- 🔍 **雙引擎圖標智能獲取**：內建 `Favicon.im` 和 `DuckDuckGo` 雙介面解析網站圖標，一鍵自動補全。
- 🤡 **智能圖標容錯**：當網址圖標獲取失敗時，自動使用精美的隨機 Emoji 兜底，告別「圖片裂開」的尷尬。
- 🔐 **安全私密**：全域基於 Token 的後台管理鑑權，支援一鍵隱藏私密分類和敏感書籤。
- 📦 **配置匯入 / 匯出**：支援將所有書籤配置匯出為 JSON 檔案，隨時備份，永不遺失。

---

## 🛠️ 技術棧

* **前端**：HTML5, CSS3, ES6 Vanilla JavaScript (純原生，無冗餘框架)
* **後端 API**：Cloudflare Pages Functions (`functions/api/config.js`)
* **資料庫**：Cloudflare Workers KV
* **第三方庫**：[SortableJS](https://github.com/SortableJS/Sortable) (拖曳)、[RemixIcon](https://remixicon.com/) (精美字體圖標)

---

## 📂 目錄結構

```text
├── index.html               # 前端主頁面 (視圖、樣式與交互邏輯)
├── manifest.json            # PWA 應用配置清單
├── ServiceWorker.js         # PWA Service Worker (離線快取核心)
└── functions/
    └── api/
        ├── config.js        # 後端 Serverless API (處理讀寫 KV 和鑑權)
        └── defaultData.js   # 預設配置檔案
```

---

## 🚀 部署指南 (Cloudflare Pages)

完全免費，整個部署過程不超過 5 分鐘！

### 第一步：準備代碼
1. Fork 本倉庫，或者將代碼 Clone 到你自己的 GitHub 倉庫中。

### 第二步：建立 Cloudflare 專案
1. 登入 [Cloudflare 控制台](https://dash.cloudflare.com/)。
2. 在左側選單找到 **Workers & Pages** -> 點擊 **建立應用程式 (Create application)**。
3. 切換到 **Pages** 標籤頁，點擊 **連接到 Git (Connect to Git)**。
4. 授權 GitHub 並選擇你剛剛準備好的倉庫。
5. **建構設定 (Build Settings)**：
   * 框架預設 (Framework preset): `None`
   * 建構命令 (Build command): *(留空)*
   * 建構輸出目錄 (Build output directory): *(留空 或填 `/`)*
6. 點擊 **儲存並部署 (Save and Deploy)**。（注意：第一次部署會提示失敗或訪問報錯，這是正常的，因為我們還沒綁定資料庫）。

### 第三步：配置 KV 資料庫與密碼
1. 回到 Cloudflare 控制台，進入左側 **Workers & Pages** -> **KV**，點擊 **建立命名空間 (Create a namespace)**，名字隨便起（例如 `my_nav_db`）。
2. 進入你剛才部署好的 Pages 專案詳情頁，點擊 **設定 (Settings)** 選項卡。
3. **綁定 KV 資料庫**：
   * 找到 **Functions** -> **KV 命名空間綁定 (KV namespace bindings)**。
   * 變數名稱 (Variable name) **必須嚴格填入**: `page_nav`
   * KV 命名空間 (KV namespace) 選擇你剛才建立的資料庫。
4. **設定管理員密碼**：
   * 在左側找到 **環境變數 (Environment variables)**。
   * 新增變數，名稱 **必須嚴格填入**: `TOKEN`
   * 值 (Value) 填入你想要的後台登入密碼（建議點擊右側的 `加密` 按鈕保護密碼）。

### 第四步：重新部署生效
1. 返回到專案的 **部署 (Deployments)** 頁面。
2. 找到最新的一次部署記錄，點擊最右側的三個點 `...` -> **重試部署 (Retry deployment)**。
3. 部署完成後，點擊系統分配的域名，即可訪問屬於你的專屬導覽站！

---

## 🎮 使用說明

1. **進入後台**：點擊頁面右下角的浮動按鈕 **「管理」**，輸入你在環境變數中設定的 `TOKEN`，按回車即可進入編輯模式。
2. **新增分類**：進入管理模式後，點擊右側新增的 **「偏好設定」** 按鈕，可以修改全域網格寬度、拖曳分類順序、修改分類名/圖標，以及新增分類。
3. **新增書籤**：在對應分類下點擊虛線框的 **「新增」** 卡片。輸入網址後，系統會自動嘗試抓取圖標並提供預覽。
4. **隱藏書籤**：點擊書籤右上角的 👁️ 眼睛圖標，即可將該書籤設為私密（僅在管理模式下可見）。
5. **儲存修改**：所有的拖曳、編輯操作在確認後會在本地即時預覽，**請務必點擊右下角管理選單裡的「儲存」按鈕**，將最新配置同步到雲端資料庫。

---

## 📄 開源協議

本專案採用 [MIT License](LICENSE) 開源協議。你可以自由地使用、修改和分發代碼，但請保留原作者歸屬聲明。
