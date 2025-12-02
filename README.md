# EXXEED | The Mission Log

**Serverless Single-File CMS & Portfolio (Version 7)**

EXXEED is a lightweight, high-performance blogging platform and portfolio site built on **Cloudflare Workers**. It features a distinct Military/Cyberpunk aesthetic, a built-in content management system (CMS), a dual-theme engine, and dynamic timeline visualization, all contained within a single JavaScript file.

---

## ⚡ Tech Stack

*   **Runtime:** Cloudflare Workers (Serverless JavaScript)
*   **Database:** Cloudflare KV (Key-Value Storage)
*   **Frontend:** HTML5, CSS3 (CSS Variables, Flexbox), Vanilla JavaScript
*   **Deployment:** Wrangler CLI
*   **Fonts:** Cinzel, JetBrains Mono, Manrope, Major Mono Display

---

## 🚀 Installation & Deployment

### 1. Prerequisites

* **Node.js** installed on your machine.

* A **Cloudflare Account**.

* **Wrangler** installed globally:

  ```bash
  npm install -g wrangler
  ```

### 2. Project Setup

Initialize a folder and login to Cloudflare:

```bash
mkdir exxeed-blog
cd exxeed-blog
wrangler login
```
