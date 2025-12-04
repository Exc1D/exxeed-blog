// EXXEED BLOG SYSTEM V9
const TIMELINE_DATA = [
  {
    year: "2025 - PRESENT",
    title: "Upcoming Full-stack Developer",
    desc: "Crunching The Odin Project and Scrimba.",
  },
  {
    year: "2024",
    title: "The Spark",
    desc: "Enrolled in a degree for IT. Found my calling.",
  },
  {
    year: "2021 - 2024",
    title: "Philippine Military Academy",
    desc: "Cadet. Warshocked into a military way of life, polished shoes until they mirrored the soul. (Got injured then was discharged)",
  },
  {
    year: "2018-2021",
    title: "The Valley of Confusion",
    desc: "College at Ateneo De Naga, jumped from one course to another.",
  },
];

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // SERVICE WORKER
    if (url.pathname === "/sw.js") {
      return new Response(serviceWorker, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // ROBOTS.TXT
    if (url.pathname === "/robots.txt") {
      return new Response(
        `User-agent: *\nAllow: /\nSitemap: ${url.origin}/sitemap.xml`,
        {
          headers: { "Content-Type": "text/plain" },
        }
      );
    }

    // SITEMAP.XML
    if (url.pathname === "/sitemap.xml") {
      const posts = (await env.BLOG_KV.get("posts", { type: "json" })) || [];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${
    url.origin
  }/</loc><priority>1.0</priority><changefreq>daily</changefreq></url>
  <url><loc>${
    url.origin
  }/#archive</loc><priority>0.8</priority><changefreq>daily</changefreq></url>
${posts
  .map(
    (p) =>
      `  <url><loc>${url.origin}/post/${p.id}</loc><priority>0.9</priority><changefreq>weekly</changefreq></url>`
  )
  .join("\n")}
</urlset>`;
      return new Response(sitemap, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    // API: GET POSTS
    if (url.pathname === "/api/posts" && request.method === "GET") {
      const posts = (await env.BLOG_KV.get("posts", { type: "json" })) || [];
      return new Response(JSON.stringify(posts), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=300, stale-while-revalidate=600",
        },
      });
    }

    // API: GET TIMELINE
    if (url.pathname === "/api/timeline" && request.method === "GET") {
      return new Response(JSON.stringify(TIMELINE_DATA), {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "public, max-age=3600",
        },
      });
    }

    // API: TRACK VIEW
    if (url.pathname.startsWith("/api/view/") && request.method === "POST") {
      const postId = url.pathname.split("/").pop();
      try {
        const views = (await env.BLOG_KV.get(`views:${postId}`)) || "0";
        await env.BLOG_KV.put(`views:${postId}`, String(parseInt(views) + 1));
        return new Response(
          JSON.stringify({ success: true, views: parseInt(views) + 1 }),
          {
            headers: { "Content-Type": "application/json" },
          }
        );
      } catch {
        return new Response(JSON.stringify({ success: false }), {
          status: 500,
        });
      }
    }

    // API: GET POPULAR POSTS
    if (url.pathname === "/api/popular" && request.method === "GET") {
      const posts = (await env.BLOG_KV.get("posts", { type: "json" })) || [];
      const postsWithViews = await Promise.all(
        posts.map(async (p) => ({
          ...p,
          views: parseInt((await env.BLOG_KV.get(`views:${p.id}`)) || "0"),
        }))
      );
      const popular = postsWithViews
        .sort((a, b) => b.views - a.views)
        .slice(0, 5);
      return new Response(JSON.stringify(popular), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // RSS FEED
    if (url.pathname === "/rss.xml") {
      const posts = (await env.BLOG_KV.get("posts", { type: "json" })) || [];
      const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>EXXEED | The Mission Log</title>
    <link>${url.origin}</link>
    <description>Former PMA Cadet turned Full-Stack Developer. Building in public.</description>
    <language>en-us</language>
${posts
  .slice(0, 10)
  .map(
    (p) => `    <item>
      <title>${p.title}</title>
      <link>${url.origin}/post/${p.id}</link>
      <description>${p.teaser}</description>
      <pubDate>${p.date}</pubDate>
      <guid>${url.origin}/post/${p.id}</guid>
    </item>`
  )
  .join("\n")}
  </channel>
</rss>`;
      return new Response(rss, {
        headers: { "Content-Type": "application/xml" },
      });
    }

    // API: SAVE POST
    if (
      url.pathname === "/api/posts" &&
      (request.method === "POST" || request.method === "PUT")
    ) {
      const auth = request.headers.get("Authorization");
      if (auth !== env.ADMIN_PASS)
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
        });
      try {
        const incomingPost = await request.json();
        if (!incomingPost.title || !incomingPost.content)
          return new Response("Invalid Data", { status: 400 });
        let posts = (await env.BLOG_KV.get("posts", { type: "json" })) || [];

        if (request.method === "POST") {
          // Check for duplicate ID or tag
          if (
            posts.some(
              (p) =>
                p.id === incomingPost.id ||
                (p.tag &&
                  incomingPost.tag &&
                  p.tag.toLowerCase() === incomingPost.tag.toLowerCase())
            )
          ) {
            return new Response("Duplicate ID or tag", { status: 409 });
          }
          posts.unshift(incomingPost);
        } else {
          const index = posts.findIndex((p) => p.id === incomingPost.id);
          if (index !== -1) posts[index] = incomingPost;
        }
        await env.BLOG_KV.put("posts", JSON.stringify(posts));
        return new Response("Saved", { status: 200 });
      } catch {
        return new Response("Server Error", { status: 500 });
      }
    }

    // DYNAMIC POSTS
    const postMatch = url.pathname.match(/^\/post\/([a-zA-Z0-9-]+)/);
    if (postMatch) {
      const postId = postMatch[1];
      const posts = (await env.BLOG_KV.get("posts", { type: "json" })) || [];
      const post = posts.find((p) => p.id === postId);

      if (post) {
        const postHtml = html
          .replace(
            /<title>.*<\/title>/,
            `<title>${post.title} | EXXEED</title>`
          )
          .replace(
            /<meta name="description" content=".*">/,
            `<meta name="description" content="${post.teaser}">`
          );
        return new Response(postHtml, {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "X-Frame-Options": "DENY",
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "public, max-age=300",
          },
        });
      }
    }

    // SERVE HTML
    return new Response(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "X-Frame-Options": "DENY",
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "public, max-age=300",
      },
    });
  },
};

const serviceWorker = `
const CACHE = 'exxeed-v2';
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(cache => 
    cache.addAll(['/', '/api/timeline'])
  ));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => 
    Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
  ));
});
self.addEventListener('fetch', e => {
  if(e.request.url.includes('/api/posts')) {
    e.respondWith(fetch(e.request));
    return;
  }
  e.respondWith(
    fetch(e.request).then(res => {
      return caches.open(CACHE).then(cache => {
        cache.put(e.request, res.clone());
        return res;
      });
    }).catch(() => caches.match(e.request))
  );
});
`;

// --- HTML TEMPLATE ---
const html = `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="Upcoming Full-Stack Developer, based from the Philippines. A student of the Odin Project and Scrimba.">
    <meta name="keywords" content="full-stack developer, web development, Odin Project, Scrimba, Philippines, coding blog, developer portfolio">
    <meta name="author" content="EXXEED">
    <link rel="canonical" href="https://your-domain.com/">
    <title>EXXEED | The Mission Log</title>

      
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="dns-prefetch" href="https://cdnjs.cloudflare.com">
    
    <!-- Open Graph / Twitter Meta Tags -->
    <meta property="og:title" content="EXXEED | The Mission Log">
    <meta property="og:description" content="Former PMA Cadet turned Full-Stack Developer. Building in public.">
    <meta property="og:image" content="https://i.imgur.com/3x1dKUX.jpeg">
    <meta property="og:url" content="https://your-domain.com/">
    <meta property="og:site_name" content="EXXEED">
    <meta property="og:type" content="website">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="EXXEED | The Mission Log">
    <meta name="twitter:description" content="Former PMA Cadet turned Full-Stack Developer. Building in public.">
    <meta name="twitter:image" content="https://i.imgur.com/3x1dKUX.jpeg">

    <!-- Fonts -->
    <link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@400;700&family=JetBrains+Mono:wght@400;700&family=Manrope:wght@300;400;700&family=Major+Mono+Display&display=swap" rel="stylesheet" />

    <!-- Custom Favicon -->
    <link rel="icon" type="image/svg+xml" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Cstyle%3E text %7B font-family: monospace; font-weight: bold; fill: %23ff3333; font-size: 80px; %7D %3C/style%3E%3Ctext x='50' y='75' text-anchor='middle'%3EX%3C/text%3E%3C/svg%3E">

    <!-- Structured Data -->
    <script type="application/ld+json">
    {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": "EXXEED",
      "url": "https://your-domain.com",
      "jobTitle": "Full-Stack Developer",
      "description": "Former PMA Cadet turned Full-Stack Developer. Building in public.",
      "image": "https://i.imgur.com/3x1dKUX.jpeg",
      "sameAs": []
    }
    </script>

    <!-- markdown compatibility - load on demand -->
    <!-- Syntax highlighting - load on demand --> 

    <style>
  /* --- THEME --- */
  :root {
    --bg-main: #e0e0e0; --bg-panel: #888888;
    --text-main: #0a0a0a; --text-muted: #111111;
    --accent: #ff3333; --border: #222222;
    --input-bg: rgba(255,255,255,0.1);
    --card-hover: rgba(0,0,0,0.05); 
    --focus-ring: #ff3333;
  }
  [data-theme="dark"] {
    --bg-main: #222222; --bg-panel: #282828;
    --text-main: #e6edf3; --text-muted: #8b949e;
    --accent: #00f0ff; --border: #21262d;
    --input-bg: #30363d; --card-hover: rgba(0, 240, 255, 0.05);
    --focus-ring: #00f0ff;
  }

  * { margin: 0; padding: 0; box-sizing: border-box; }
  
  /* Accessibility Focus Styles */
  :focus-visible {
    outline: 3px solid var(--focus-ring);
    outline-offset: 2px;
  }

  body {
    background-color: var(--bg-main); color: var(--text-main);
    font-family: "Manrope", sans-serif; height: 100vh; width: 100vw;
    overflow: hidden; display: flex; transition: background 0.5s, color 0.5s;
  }
  
  .noise-overlay {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; pointer-events: none; z-index: 999; opacity: 0.04;
    background: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noise"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noise)" opacity="1"/%3E%3C/svg%3E');
  }

  /* --- TOAST NOTIFICATIONS (CUSTOM ALERTS) --- */
  #toast-container {
      position: fixed; bottom: 2rem; right: 2rem; z-index: 2000;
      display: flex; flex-direction: column; gap: 0.8rem; pointer-events: none;
  }
  .toast {
      background: #1a1a1a;
      color: #fff;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.9rem;
      padding: 1rem 1.5rem;
      border-left: 4px solid var(--accent);
      box-shadow: 0 5px 15px rgba(0,0,0,0.5);
      min-width: 250px;
      opacity: 0;
      transform: translateY(20px);
      animation: slideUpFade 0.3s forwards;
      pointer-events: all;
      display: flex; align-items: center;
  }
  [data-theme="dark"] .toast { background: #000; border: 1px solid #333; border-left: 4px solid var(--accent); }
  
  .toast.success { border-left-color: #4caf50; }
  .toast.error { border-left-color: #ff3333; }
  
  @keyframes slideUpFade {
      to { opacity: 1; transform: translateY(0); }
  }
  @keyframes fadeOut {
      to { opacity: 0; transform: translateX(20px); }
  }

  /* --- HOURGLASS LOADER --- */
  .hourglass-loader {
    position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
    background: var(--bg-main); z-index: 9999; display: flex; 
    align-items: center; justify-content: center; flex-direction: column;
    transition: opacity 0.5s, visibility 0.5s;
  }
  .hourglass-loader.hidden { opacity: 0; visibility: hidden; }
  
  .hourglass {
    font-family: "Major Mono Display", monospace; font-size: 4rem; 
    color: var(--accent); font-weight: bold; position: relative;
    animation: hourglassRotate 2s ease-in-out infinite;
  }
  
  @keyframes hourglassRotate {
    0%, 100% { transform: rotate(0deg); }
    50% { transform: rotate(180deg); }
  }
  
  .hourglass-text {
    font-family: "JetBrains Mono", monospace; font-size: 0.9rem;
    color: var(--text-muted); margin-top: 2rem; letter-spacing: 2px;
    animation: pulse 1.5s ease-in-out infinite;
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.5; }
    50% { opacity: 1; }
  }

  /* --- LAYOUT --- */
  .left-pane {
    width: 35%; height: 100%; background: var(--bg-panel); border-right: 1px solid var(--border); padding: 4rem;
    display: flex; flex-direction: column; justify-content: space-between; position: relative; transition: background 0.5s;
  }
  .right-pane { width: 65%; height: 100%; overflow-y: auto; position: relative; scroll-behavior: smooth; }

  /* --- NAV --- */
  .nav-dock {
    position: fixed; top: 2rem; right: 2rem; z-index: 100; display: flex; gap: 1.5rem; align-items: center;
    background: rgba(0, 0, 0, 0.7); backdrop-filter: blur(10px); padding: 0.8rem 2rem; 
    border-radius: 50px; border: 1px solid var(--border);
    transition: transform 0.3s ease, opacity 0.3s ease;
  }
  .nav-link {
    color: #ccc; text-decoration: none; font-family: "JetBrains Mono", monospace; font-size: 0.8rem;
    text-transform: uppercase; letter-spacing: 1px; transition: all 0.3s; cursor: pointer; position: relative; display: flex; align-items: center;
    border: none; background: none;
  }
  .nav-link:hover, .nav-link.active { color: #fff; text-shadow: 0 0 8px var(--accent); }
  .nav-link.active::after {
    content: ''; position: absolute; bottom: -4px; left: 0; width: 100%; height: 2px; background: var(--accent); box-shadow: 0 0 5px var(--accent);
  }
  
  .mobile-toggle {
    position: fixed; top: 1.5rem; right: 1.5rem; z-index: 101; display: none;
    background: var(--bg-panel); border: 1px solid var(--border); padding: 0.8rem; border-radius: 8px; cursor: pointer;
  }
  .mobile-toggle svg { width: 24px; height: 24px; stroke: var(--text-main); }

  .theme-switch {
    position: fixed; top: 2rem; left: 2rem; z-index: 100;
    background: none; border: none; cursor: pointer; opacity: 0.2; transition: opacity 0.3s, transform 0.3s;
    color: var(--text-main);
  }
  .theme-switch:hover, .theme-switch:focus { opacity: 1; transform: rotate(15deg); }
  .theme-switch svg { width: 24px; height: 24px; fill: currentColor; }

  /* --- BRANDING --- */
  .brand-vertical {
    font-family: "Cinzel", serif; font-size: 8rem; line-height: 0.8; color: #fff; opacity: 0.08;
    position: absolute; bottom: -2rem; left: -1rem; z-index: 0; pointer-events: none;
    writing-mode: vertical-rl; transform: rotate(180deg);
  }
  .brand-x {
    font-family: "Major Mono Display", monospace; color: var(--accent);
    font-size: 1.2em; font-weight: bold; display: inline-block; transform: translateY(2px);
  }
  .mission-stat { font-family: "JetBrains Mono", monospace; border-left: 2px solid var(--accent); padding-left: 1rem; margin-bottom: 2rem; }
  .stat-label { font-size: 0.7rem; color: var(--text-muted); text-transform: uppercase; }
  .stat-val { font-size: 1.2rem; font-weight: 700; color: #fff; }

  .content-container { 
  padding: 8rem 6rem 4rem 6rem; 
  max-width: 900px; 
  margin: 0 auto; 
  display: none; 
  opacity: 0; 
  animation: fadeIn 0.4s forwards; 
  }
  .content-container.active-view { display: block; }
  @keyframes fadeIn { to { opacity: 1; transform: translateY(0); } }

  h1.article-title { font-family: "Cinzel", serif; font-size: 4rem; line-height: 1.1; margin-bottom: 2rem; }
  .meta-tag { font-family: "JetBrains Mono"; font-size: 0.8rem; color: var(--accent); border: 1px solid var(--accent); padding: 4px 12px; display: inline-block; margin-bottom: 2rem; }

  .article-body {
  font-size: 1.2rem;
  line-height: 1.8;
  color: var(--text-main);
  margin-top: 3rem;
  max-width: 800px;
  }

  .article-body p {
    margin-bottom: 1.5rem;
  }

  .article-body h1, .article-body h2, .article-body h3 {
    margin-top: 2.5rem;
    margin-bottom: 1rem;
  }

  .article-body ul, .article-body ol {
    margin-left: 2rem;
    margin-bottom: 1.5rem;
  }

  .article-body code {
    background: var(--input-bg);
    padding: 0.2rem 0.5rem;
    border-radius: 4px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.9em;
  }

  .article-body pre {
    background: var(--input-bg);
    padding: 1.5rem;
    border-radius: 8px;
    overflow-x: auto;
    margin-bottom: 1.5rem;
  }

  .article-body blockquote {
    border-left: 3px solid var(--accent);
    padding-left: 1.5rem;
    margin: 1.5rem 0;
    font-style: italic;
    color: var(--text-muted);
  }
    .back-btn {
    display: inline-block;
    font-family: 'JetBrains Mono', monospace;
    color: var(--accent);
    text-decoration: none;
    margin-bottom: 3rem;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .back-btn:hover {
    transform: translateX(-5px);
  }

  /* --- DOSSIER & AVATAR --- */
  .dossier-section { margin-top: 6rem; padding-top: 4rem; border-top: 2px solid var(--border); }
  .dossier-grid { display: flex; gap: 3rem; align-items: flex-start; margin-bottom: 3rem; }
  .dossier-avatar {
    width: 150px; height: 150px; border-radius: 50%; border: 2px solid var(--accent);
    box-shadow: 0 0 20px rgba(0, 0, 0, 0.3); object-fit: cover; flex-shrink: 0; transition: all 0.3s ease;
  }
  [data-theme="dark"] .dossier-avatar { box-shadow: 0 0 20px rgba(0, 240, 255, 0.3); }
  .dossier-avatar:hover { transform: scale(1.05); }
  
  .timeline-container { position: relative; }
  .timeline-item {
    border-left: 1px solid var(--border); padding-left: 2rem; padding-bottom: 3rem; position: relative; transition: opacity 0.3s;
  }
  .timeline-item::before {
    content: ""; position: absolute; left: -5px; top: 5px; width: 9px; height: 9px; background: var(--bg-main);
    border: 2px solid var(--accent); border-radius: 50%; transition: background 0.3s, box-shadow 0.3s;
  }
  .timeline-item:hover::before { background: var(--accent); box-shadow: 0 0 10px var(--accent); }
  .timeline-year { font-family: "JetBrains Mono"; color: var(--accent); margin-bottom: 0.5rem; display: block; font-weight: bold; }
  .timeline-title { font-size: 1.5rem; margin-bottom: 0.5rem; font-family: "Manrope"; font-weight: 700; }
  .timeline-desc { color: var(--text-muted); font-size: 1.1rem; line-height: 1.6; }

  /* --- POSTS --- */
  .post-item { 
    border-bottom: 1px solid var(--border); padding: 1.5rem; margin-bottom: 1.5rem; cursor: pointer; 
    transition: all 0.3s; border-radius: 4px; position: relative;
  }
  .post-item:hover { background: var(--card-hover); transform: translateX(10px); border-left: 2px solid var(--accent); }
  .post-meta { display: flex; justify-content: space-between; margin-bottom: 0.5rem; }
  .post-tag { font-family: 'JetBrains Mono'; color: var(--accent); }
  .post-date { font-family: 'JetBrains Mono'; color: var(--text-muted); opacity: 0.7; }
  .post-title { font-size: 1.8rem; margin-bottom: 0.8rem; font-weight: 700; }
  .post-teaser { color: var(--text-muted); font-size: 1rem; line-height: 1.5; }

  .see-more-btn {
    display: block; width: 100%; padding: 1rem; margin-top: 2rem;
    background: transparent; border: 1px solid var(--border); color: var(--text-muted);
    font-family: "JetBrains Mono"; cursor: pointer; text-transform: uppercase; transition: all 0.3s;
  }
  .see-more-btn:hover, .see-more-btn:focus { background: var(--accent); color: #000; border-color: var(--accent); }

  /* --- ADMIN --- */
  .admin-gate { text-align: center; padding: 4rem 0; }
  .admin-gate input {
      width: 60%; max-width: 300px; padding: 1rem; background: var(--input-bg);
      border: 1px solid var(--border); color: var(--text-main); font-family: "JetBrains Mono";
      margin-bottom: 1rem; outline: none; text-align: center;
  }
  .admin-gate input:focus { border-color: var(--accent); }
  .admin-panel { display: none; }
  .admin-panel.unlocked { display: block; }

  .search-wrapper { position: relative; margin-bottom: 2rem; }
  .search-input {
    width: 100%; background: var(--input-bg); border: 1px solid var(--border); color: var(--text-main);
    padding: 1rem 1rem 1rem 3rem; font-family: "JetBrains Mono"; font-size: 1rem; outline: none; transition: border-color 0.3s;
  }
  .search-input:focus { border-color: var(--accent); }
  .search-icon { 
  position: absolute; 
  left: 1rem; 
  top: 50%; 
  transform: translateY(-50%); 
  color: var(--text-muted);
  width: 18px;
  height: 18px;
  stroke: var(--text-muted);
  }

  .admin-form input, .admin-form textarea {
    width: 100%; background: var(--input-bg); border: 1px solid var(--border); padding: 1rem; margin-bottom: 1rem;
    color: var(--text-main); font-family: "JetBrains Mono"; outline: none;
  }
  .admin-form textarea {
    min-height: 300px;
   resize: vertical;
   line-height: 1.6;
  }
  .btn { background: var(--accent); color: #000; border: none; padding: 1rem 2rem; font-family: "JetBrains Mono"; cursor: pointer; font-weight: bold; margin-right: 1rem; transition: transform 0.2s; }
  .btn:hover, .btn:focus { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(0,0,0,0.3); }

  .admin-list-item { 
      display: flex; justify-content: space-between; align-items: center; 
      padding: 1rem; border: 1px solid var(--border); margin-bottom: 0.5rem; 
      background: var(--input-bg); transition: transform 0.2s;
  }
  .admin-list-item:hover { transform: scale(1.01); border-color: var(--accent); }

  /* Reading Time & Meta Info */
  .post-meta-info { display: flex; gap: 1rem; align-items: center; margin-bottom: 1rem; font-family: 'JetBrains Mono'; font-size: 0.85rem; color: var(--text-muted); }
  .reading-time { display: flex; align-items: center; gap: 0.3rem; }
  .view-count { display: flex; align-items: center; gap: 0.3rem; }

  /* Share Buttons */
  .share-section { margin: 3rem 0; padding: 2rem; border: 1px solid var(--border); border-radius: 8px; background: var(--input-bg); }
  .share-buttons { display: flex; gap: 1rem; flex-wrap: wrap; }
  .share-btn { padding: 0.8rem 1.5rem; border: 1px solid var(--border); background: transparent; color: var(--text-main); font-family: 'JetBrains Mono'; cursor: pointer; transition: all 0.3s; display: flex; align-items: center; gap: 0.5rem; }
  .share-btn:hover { background: var(--accent); color: #000; border-color: var(--accent); transform: translateY(-2px); }

  /* Related Posts */
  .related-posts { margin-top: 4rem; padding-top: 2rem; border-top: 2px solid var(--border); }
  .related-posts h3 { font-family: 'Cinzel'; margin-bottom: 1.5rem; }
  .related-post-item { padding: 1rem; border: 1px solid var(--border); margin-bottom: 1rem; cursor: pointer; transition: all 0.3s; }
  .related-post-item:hover { background: var(--card-hover); border-color: var(--accent); }

  /* Popular Posts Widget */
  .popular-posts { margin-top: 2rem; padding: 1.5rem; border: 1px solid var(--border); border-radius: 8px; background: var(--input-bg); }
  .popular-posts h3 { font-family: 'Cinzel'; font-size: 1.2rem; margin-bottom: 1rem; }
  .popular-post-item { padding: 0.8rem; border-bottom: 1px solid var(--border); cursor: pointer; transition: all 0.2s; }
  .popular-post-item:last-child { border-bottom: none; }
  .popular-post-item:hover { background: var(--card-hover); transform: translateX(5px); }

  @media (max-width: 900px) {
    body { flex-direction: column; overflow-y: auto; height: auto; }
    .left-pane { width: 100%; padding: 2rem; border-bottom: 1px solid var(--border); height: auto; }
    .right-pane { width: 100%; overflow: visible; }
    .content-container { padding: 4rem 2rem; }
    .brand-vertical { display: none; }
    .mobile-toggle { display: block; }
    .dossier-grid { flex-direction: column; align-items: center; text-align: center; }
    
    .nav-dock { 
        position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
        flex-direction: column; justify-content: center; background: rgba(0,0,0,0.95);
        border-radius: 0; opacity: 0; pointer-events: none; transform: translateY(-20px);
    }
    .nav-dock.active-mobile { opacity: 1; pointer-events: all; transform: translateY(0); }
    .nav-link { font-size: 1.5rem; margin-bottom: 2rem; }
    .theme-switch { top: 1.5rem; left: 1.5rem; opacity: 1; }
  }
</style>

  

  </head>
  <body>
    <div class="noise-overlay"></div>
    
    <!-- Hourglass Loader -->
    <div class="hourglass-loader" id="hourglassLoader">
      <div class="hourglass">X</div>
      <div class="hourglass-text">LOADING MISSION DATA...</div>
    </div>
    
    <!-- Notification Container -->
<div id="toast-container" role="status" aria-live="polite" aria-atomic="true"></div>

<button class="theme-switch" onclick="toggleTheme()" aria-label="Toggle Theme">
    <svg viewBox="0 0 24 24" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>
</button>

<button class="mobile-toggle" onclick="toggleMobileNav()" aria-label="Menu">
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
</button>

<nav class="nav-dock" id="mainNav">
  <button class="nav-link active" onclick="switchView('home')" aria-label="Go to Home Log">Log</button>
  <button class="nav-link" onclick="switchView('archive')" aria-label="Go to Archive">Archive</button>
  <button class="nav-link" onclick="switchView('admin')" aria-label="Admin Access">
     <svg style="width:18px; height:18px;" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
  </button>
</nav>

<aside class="left-pane">
    <div style="margin-top: auto;">
        <div class="mission-stat"><div class="stat-label">OPERATOR</div><div class="stat-val">EX<span class="brand-x">X</span>EED</div></div>
        <div class="mission-stat"><div class="stat-label">CURRENT OBJ</div><div class="stat-val">BUILD IN PUBLIC</div></div>
        <div class="mission-stat"><div class="stat-label">STATUS</div><div class="stat-val" style="color: #4caf50;">ONLINE</div></div>
    </div>
    <div class="brand-vertical">EX<span class="brand-x">X</span>EED</div>
</aside>

<main class="right-pane" id="rightPane">
  
  <!-- VIEW 1: HOME -->
  <div id="view-home" class="content-container" role="tabpanel">
    <span class="meta-tag">MISSION LOG // LATEST</span>
    <h1 class="article-title">The Journey <br />So Far.</h1>
    <div id="home-posts" style="margin-top: 4rem;">Loading...</div>
    
    <div class="dossier-section">
        <h2 class="article-title" style="font-size: 2.5rem;">About EX<span class="brand-x">X</span>EED</h2>
        
        <div class="dossier-grid">
             <img data-src="https://i.imgur.com/3x1dKUX.jpeg" class="dossier-avatar lazy" alt="Operator Avatar" onerror="this.src='https://via.placeholder.com/150/ff3333/000000?text=EXXEED'">
             <div>
                <p style="font-size: 1.2rem; line-height: 1.6; color: var(--text-muted);">
                  Former PMA Cadet turned Full-Stack Developer. I traded my rifle for a keyboard, but kept the discipline.
                </p>
             </div>
        </div>

        <div id="timeline-container" class="timeline-container"></div>
        <button id="timeline-btn" class="see-more-btn" style="display:none" onclick="toggleLimit('timeline')">See More Experience [ + ]</button>
    </div>
  </div>

  <!-- VIEW 2: ARCHIVE -->
  <div id="view-archive" class="content-container" role="tabpanel">
    <span class="meta-tag">FULL DATABASE</span>
    <h1 class="article-title">All Logs.</h1>
    <div class="search-wrapper">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <path d="m21 21-4.35-4.35"></path>
      </svg>
      <input type="text" class="search-input" placeholder="Search parameters..." onkeyup="filterList(this.value, 'archive')" aria-label="Search posts in archive">
      </div>
    <div id="archive-posts"></div>
    <button id="archive-btn" class="see-more-btn" style="display:none" onclick="toggleLimit('archive')">See More [ + ]</button>
  </div>

  <!-- VIEW 3: SINGLE -->
  <div id="view-single" class="content-container" role="tabpanel">
    <a class="back-btn" onclick="switchView('home')" tabindex="0" role="button" onkeydown="handleKey(event, () => switchView('home'))" aria-label="Return to previous page"><< RETURN</a>
    <div id="single-post-content"></div>
  </div>

  <!-- VIEW 4: ADMIN -->
  <div id="view-admin" class="content-container" role="tabpanel">
    <span class="meta-tag">RESTRICTED ACCESS</span>
    <h1 class="article-title" id="admin-header">Admin Link</h1>
    
    <div id="admin-gate" class="admin-gate">
        <p style="font-family:'JetBrains Mono'; margin-bottom:1rem; color:var(--text-muted);">ENCRYPTED CONNECTION REQUIRED</p>
        <input type="password" id="gate-pass" placeholder="Enter Passkey" aria-label="Password">
        <br>
        <button class="btn" onclick="unlockAdmin()">Authenticate</button>
    </div>

    <div id="admin-panel" class="admin-panel">
        <div class="admin-form">
            <input type="hidden" id="post-id"> 
            <input type="text" id="post-title" placeholder="Mission Title" aria-label="Post Title">
            <div style="display: flex; gap: 1rem;">
                <input type="text" id="post-tag" placeholder="ID (LOG_005)" style="flex:1" aria-label="Log ID">
                <input type="text" id="post-date" placeholder="Date (DEC 05)" style="flex:1" aria-label="Post Date">
            </div>
            <input type="text" id="post-teaser" placeholder="Teaser" aria-label="Teaser">
            <textarea id="post-content" placeholder="Content (HTML Allowed)" aria-label="Content"></textarea>
            <button class="btn" onclick="submitPost()" id="submit-btn">Submit Log</button>
            <button class="btn" style="background:#555; color:#fff;" onclick="resetForm()">Clear</button>
        </div>

        <div style="margin-top: 4rem; border-top: 1px solid var(--border); padding-top: 2rem;">
            <h3 style="font-family: 'Cinzel'; margin-bottom: 1rem;">Manage Logs</h3>
            <div class="search-wrapper">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <circle cx="11" cy="11" r="8"></circle>
                      <path d="m21 21-4.35-4.35"></path>
              </svg>
              <input type="text" class="search-input" placeholder="Search database..." onkeyup="filterList(this.value, 'admin')" aria-label="Search posts in admin database">
              </div>
            <div id="admin-post-list"></div>
            <button id="admin-btn" class="see-more-btn" style="display:none" onclick="toggleLimit('admin')">See More [ + ]</button>
        </div>
    </div>
  </div>

</main>

<script>
  (function() {
    const path = window.location.pathname;
    let targetView = 'home';

    if (path.startsWith('/post/')) {
      targetView = 'single';
    } else if (path.startsWith('/archive')) {
      targetView = 'archive';
    } else if (path.startsWith('/admin')) {
      targetView = 'admin';
    }

    const viewEl = document.getElementById('view-' + targetView);
    if (viewEl) {
      viewEl.classList.add('active-view');
    }

    // Update nav
    const navLinks = document.querySelectorAll(".nav-link");
    if (targetView === 'home' && navLinks[0]) navLinks[0].classList.add("active");
    else if (targetView === 'archive' && navLinks[1]) navLinks[1].classList.add("active");
    else if (targetView === 'admin' && navLinks[2]) navLinks[2].classList.add("active");
  })();
  
  let allPosts = [];
  let timelineData = []; 
  let defaults = { archive: 5, admin: 5, timeline: 2 };
  let limits = { ...defaults };
  let filteredPosts = [];
  let adminPass = null;

  function initTheme() {
    const s = localStorage.getItem('theme');
    if(s === 'dark' || (!s && window.matchMedia('(prefers-color-scheme: dark)').matches)) 
        document.documentElement.setAttribute('data-theme', 'dark');
  }
  function toggleTheme() {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    if(isDark) { document.documentElement.removeAttribute('data-theme'); localStorage.setItem('theme', 'light'); }
    else { document.documentElement.setAttribute('data-theme', 'dark'); localStorage.setItem('theme', 'dark'); }
    showToast("THEME UPDATED", "success");
  }
  initTheme();

  function toggleMobileNav() { document.getElementById('mainNav').classList.toggle('active-mobile'); }

  // --- NOTIFICATION SYSTEM ---
  function showToast(msg, type) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = \`toast \${type}\`;
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.textContent = \`> SYSTEM: \${msg}\`;
    container.appendChild(el);
    setTimeout(() => {
        el.style.animation = "fadeOut 0.4s forwards";
        setTimeout(() => el.remove(), 400);
    }, 3000);
  }

  // --- HISTORY & A11Y ---
  window.addEventListener('popstate', (event) => {
    if (event.state) {
      if (event.state.view === 'single' && event.state.postId) {
        openPost(event.state.postId, false);
      } else {
        switchView(event.state.view || 'home', false);
      }
    } else {
      switchView('home', false);
    }
  });

  function handleKey(e, action) {
      if(e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          action();
      }
  }

  async function fetchData() {
    const homeDiv = document.getElementById('home-posts');
    try {
      const [resPosts, resTime] = await Promise.all([
        fetch('/api/posts'),
        fetch('/api/timeline')
      ]);
      allPosts = await resPosts.json();
      filteredPosts = allPosts;
      buildSearchIndex();
      timelineData = await resTime.json();
      renderViews();
    } catch { 
        homeDiv.innerHTML = '<p style="color:var(--text-muted);">Failed to load data. Please refresh.</p>';
        showToast("DATA CONNECTION FAILED", "error");
    }
  }

  function renderViews() {
    const homeDiv = document.getElementById('home-posts');
    const frag = document.createDocumentFragment();
    allPosts.slice(0, 3).forEach(p => frag.appendChild(createPostHTML(p)));
    homeDiv.innerHTML = '';
    homeDiv.appendChild(frag);
    renderTimeline();
    renderList('archive');
    renderList('admin');
  }

  function renderTimeline() {
    const container = document.getElementById('timeline-container');
    const btn = document.getElementById('timeline-btn');
    const frag = document.createDocumentFragment();
    
    timelineData.slice(0, limits.timeline).forEach(item => {
        const div = document.createElement('div');
        div.className = 'timeline-item';
        div.innerHTML = \`<span class="timeline-year">\${item.year}</span><h3 class="timeline-title">\${item.title}</h3><p class="timeline-desc">\${item.desc}</p>\`;
        frag.appendChild(div);
    });
    container.innerHTML = '';
    container.appendChild(frag);

    btn.textContent = limits.timeline > defaults.timeline ? "See Less [ - ]" : "See More Experience [ + ]";
    btn.style.display = timelineData.length > defaults.timeline ? 'block' : 'none';
  }

  function renderList(type) {
     const container = document.getElementById(type === 'archive' ? 'archive-posts' : 'admin-post-list');
     const btn = document.getElementById(type === 'archive' ? 'archive-btn' : 'admin-btn');
     const frag = document.createDocumentFragment();
     
     filteredPosts.slice(0, limits[type]).forEach(p => {
        if(type === 'archive') frag.appendChild(createPostHTML(p));
        else {
            const div = document.createElement('div');
            div.className = 'admin-list-item';
            div.innerHTML = \`<span style="font-family:'JetBrains Mono'">\${p.tag} - \${p.title}</span><span style="cursor:pointer; text-decoration:underline" tabindex="0" role="button" onkeydown="handleKey(event, () => loadIntoForm('\${p.id}'))" onclick="loadIntoForm('\${p.id}')">[EDIT]</span>\`;
            frag.appendChild(div);
        }
     });
     container.innerHTML = '';
     container.appendChild(frag);

     btn.textContent = limits[type] > defaults[type] ? "See Less [ - ]" : "See More [ + ]";
     btn.style.display = filteredPosts.length > defaults[type] ? 'block' : 'none';
  }

  function toggleLimit(type) {
    if(limits[type] > defaults[type]) limits[type] = defaults[type];
    else limits[type] += 5;
    if(type === 'timeline') renderTimeline();
    else renderList(type);
  }

  // Search Index
  let searchIndex = [];
  function buildSearchIndex() {
    searchIndex = allPosts.map(p => ({
      id: p.id,
      text: (p.title + ' ' + p.tag + ' ' + p.teaser + ' ' + p.content).toLowerCase()
    }));
  }

  // Reading Time Estimation
  function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/s+/).length;
    const minutes = Math.ceil(words / wordsPerMinute);
    return minutes;
  }

  // Related Posts
  function getRelatedPosts(currentPost, limit = 3) {
    return allPosts
      .filter(p => p.id !== currentPost.id && p.tag === currentPost.tag)
      .slice(0, limit);
  }

  // Share Functions
  function shareOnTwitter(title, url) {
    window.open(\`https://twitter.com/intent/tweet?text=\${encodeURIComponent(title)}&url=\${encodeURIComponent(url)}\`, '_blank');
  }

  function shareOnLinkedIn(url) {
    window.open(\`https://www.linkedin.com/sharing/share-offsite/?url=\${encodeURIComponent(url)}\`, '_blank');
  }

  function copyLink(url) {
    navigator.clipboard.writeText(url).then(() => {
      showToast('LINK COPIED TO CLIPBOARD', 'success');
    }).catch(() => {
      showToast('FAILED TO COPY LINK', 'error');
    });
  }

  // Track View
  async function trackView(postId) {
    try {
      await fetch(\`/api/view/\${postId}\`, { method: 'POST' });
    } catch (e) {
      console.error('Failed to track view:', e);
    }
  }

  // Session Management
  function getSession() {
    try {
      return JSON.parse(localStorage.getItem('session') || '{}');
    } catch {
      return {};
    }
  }

  function updateSession(key, value) {
    try {
      const session = getSession();
      session[key] = value;
      localStorage.setItem('session', JSON.stringify(session));
    } catch (e) {
      console.error('Failed to update session:', e);
    }
  }

  function filterList(query, type) {
     const q = query.toLowerCase();
     if(searchIndex.length) {
       const ids = searchIndex.filter(s => s.text.includes(q)).map(s => s.id);
       filteredPosts = allPosts.filter(p => ids.includes(p.id));
     } else {
       filteredPosts = allPosts.filter(p => p.title.toLowerCase().includes(q) || p.tag.toLowerCase().includes(q));
     }
     limits[type] = defaults[type];
     renderList(type);
  }

  function createPostHTML(post) {
    const div = document.createElement('div');
    div.className = 'post-item';
    div.setAttribute('role', 'button');
    div.setAttribute('tabindex', '0');
    div.setAttribute('aria-label', 'Read ' + post.title);
    div.onclick = () => openPost(post.id);
    div.onkeydown = (e) => handleKey(e, () => openPost(post.id));
    const readTime = calculateReadingTime(post.content || '');
    div.innerHTML = \`<div class="post-meta"><span class="post-tag">\${post.tag}</span><span class="post-date">\${post.date}</span><span class="reading-time">📖 \${readTime} min read</span></div><h2 class="post-title">\${post.title}</h2><p class="post-teaser">\${post.teaser}</p>\`;
    return div;
  }

  function switchView(view, pushToHistory = true) {
    document.getElementById('mainNav').classList.remove('active-mobile');
    document.querySelectorAll(".nav-link").forEach(el => el.classList.remove("active"));
    
    const links = document.querySelectorAll(".nav-link");
    if (view === 'home') links[0].classList.add("active");
    if (view === 'archive') links[1].classList.add("active");
    if (view === 'admin') links[2].classList.add("active");

    document.querySelectorAll(".content-container").forEach(el => el.classList.remove("active-view"));
    
    let activeEl;
    if(view === 'single') activeEl = document.getElementById('view-single');
    else if (view === 'admin') activeEl = document.getElementById('view-admin');
    else if (view === 'archive') activeEl = document.getElementById('view-archive');
    else activeEl = document.getElementById('view-home');
    
    activeEl.classList.add('active-view');
    document.getElementById("rightPane").scrollTop = 0;

    if (pushToHistory) {
      history.pushState({ view: view }, "", view === 'home' ? '/' : '/' + view);
    }
  }

  function unlockAdmin() {
      const pass = document.getElementById('gate-pass').value;
      if(pass) {
          adminPass = pass;
          document.getElementById('gate-pass').value = '';
          document.getElementById('admin-gate').style.display = 'none';
          document.getElementById('admin-panel').classList.add('unlocked');
          document.getElementById('admin-header').innerText = "Dashboard";
          showToast("ACCESS GRANTED", "success");
      } else { 
          showToast("INVALID PASSKEY", "error"); 
      }
  }

  async function openPost(id, pushToHistory = true) {
    const p = allPosts.find(x => x.id === id);
    if(!p) return;
    
    // Load libraries if needed
    await loadMarked();
    await loadPrism();
    
    const readTime = calculateReadingTime(p.content || '');
    const currentUrl = window.location.origin + '/post/' + id;
    const related = getRelatedPosts(p);
    
    let relatedHTML = '';
    if(related.length > 0) {
      relatedHTML = \`<div class="related-posts"><h3>Related Posts</h3>\${related.map(r => 
        \`<div class="related-post-item" onclick="openPost('\${r.id}')" role="button" tabindex="0"><strong>\${r.title}</strong><p style="color:var(--text-muted);margin-top:0.5rem;">\${r.teaser}</p></div>\`
      ).join('')}</div>\`;
    }
    
    document.getElementById('single-post-content').innerHTML = \`
        <span class="meta-tag">STATUS: ARCHIVED</span>
        <h1 class="article-title">\${p.title}</h1>
        <div class="post-meta-info">
          <span class="reading-time">📖 \${readTime} min read</span>
          <span class="post-date">\${p.date}</span>
        </div>
        <div class="article-body">\${marked.parse(p.content)}</div>
        <div class="share-section">
          <h3 style="font-family:'Cinzel';margin-bottom:1rem;">Share This Post</h3>
          <div class="share-buttons">
            <button class="share-btn" onclick="shareOnTwitter('\${p.title}', '\${currentUrl}')">🐦 Twitter</button>
            <button class="share-btn" onclick="shareOnLinkedIn('\${currentUrl}')">💼 LinkedIn</button>
            <button class="share-btn" onclick="copyLink('\${currentUrl}')">🔗 Copy Link</button>
          </div>
        </div>
        \${relatedHTML}
    \`;
    
    // Track view
    trackView(id);
    updateSession('lastViewed', id);
    
    // Syntax highlighting
    if(typeof Prism !== 'undefined') {
      setTimeout(() => Prism.highlightAll(), 100);
    }
    
    if (pushToHistory) {
      history.pushState({ view: 'single', postId: id }, "", "/post/" + id);
    }
    switchView('single', false);
  }

  function resetForm() {
  document.getElementById('post-id').value = '';
  document.getElementById('post-title').value = '';
  document.getElementById('post-tag').value = '';
  document.getElementById('post-date').value = '';
  document.getElementById('post-teaser').value = '';
  document.getElementById('post-content').value = '';
  document.getElementById('submit-btn').innerText = "Submit Log";
  
  // Clear validation borders
  document.getElementById('post-title').style.borderColor = "var(--border)";
  document.getElementById('post-tag').style.borderColor = "var(--border)";
  document.getElementById('post-date').style.borderColor = "var(--border)";
  document.getElementById('post-teaser').style.borderColor = "var(--border)";
  document.getElementById('post-content').style.borderColor = "var(--border)";
  }

  function loadIntoForm(id) {
    const p = allPosts.find(x => x.id === id);
    if(!p) return;
    document.getElementById('post-id').value = p.id;
    document.getElementById('post-title').value = p.title;
    document.getElementById('post-tag').value = p.tag;
    document.getElementById('post-date').value = p.date;
    document.getElementById('post-teaser').value = p.teaser;
    document.getElementById('post-content').value = p.content;
    document.getElementById('submit-btn').innerText = "Update";
    document.getElementById("rightPane").scrollTop = 0;
  }

  async function submitPost() {
  const pass = adminPass;
  const id = document.getElementById('post-id').value; 
  const title = document.getElementById('post-title').value.trim();
  const tag = document.getElementById('post-tag').value.trim();
  const date = document.getElementById('post-date').value.trim();
  const teaser = document.getElementById('post-teaser').value.trim();
  const content = document.getElementById('post-content').value.trim();

  // Validate authentication
  if(!pass) { 
    showToast("SESSION EXPIRED. REFRESH PAGE.", "error"); 
    return; 
  }

  // Validate required fields
  const validationErrors = [];
  
  if(!title) {
    validationErrors.push("Title is required");
    document.getElementById('post-title').style.borderColor = "var(--accent)";
  } else {
    document.getElementById('post-title').style.borderColor = "var(--border)";
  }

  if(!tag) {
    validationErrors.push("Log ID is required");
    document.getElementById('post-tag').style.borderColor = "var(--accent)";
  } else {
    document.getElementById('post-tag').style.borderColor = "var(--border)";
  }

  if(!date) {
    validationErrors.push("Date is required");
    document.getElementById('post-date').style.borderColor = "var(--accent)";
  } else {
    document.getElementById('post-date').style.borderColor = "var(--border)";
  }

  if(!teaser) {
    validationErrors.push("Teaser is required");
    document.getElementById('post-teaser').style.borderColor = "var(--accent)";
  } else {
    document.getElementById('post-teaser').style.borderColor = "var(--border)";
  }

  if(!content) {
    validationErrors.push("Content is required");
    document.getElementById('post-content').style.borderColor = "var(--accent)";
  } else {
    document.getElementById('post-content').style.borderColor = "var(--border)";
  }

  // Show validation errors
  if(validationErrors.length > 0) {
    showToast("VALIDATION FAILED: " + validationErrors[0], "error");
    return;
  }

  // Prepare payload
  // Use a robust unique ID generator (UUID) for new posts
  const method = id ? 'PUT' : 'POST';
  const generateUUID = () => {
    // Simple RFC4122 version 4 compliant UUID generator
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0, v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };
  const payload = { 
    id: id || generateUUID(), 
    title, 
    tag, 
    date, 
    teaser, 
    content 
  };

  // Submit to server
  try {
      const res = await fetch('/api/posts', {
          method: method,
          headers: { 
            'Content-Type': 'application/json', 
            'Authorization': pass 
          },
          body: JSON.stringify(payload)
      });

      if(res.status === 200 || res.status === 201) {
          showToast("ENTRY SAVED SUCCESSFULLY", "success");
          resetForm();
          if('serviceWorker' in navigator && navigator.serviceWorker.controller) {
            navigator.serviceWorker.controller.postMessage({type: 'CLEAR_CACHE'});
          }
          await fetchData();
          if(method === 'POST') switchView('home');
          else renderList('admin');
      } else if(res.status === 401) {
          showToast("AUTH FAILED - INVALID PASSKEY", "error");
      } else if(res.status === 400) {
          showToast("INVALID DATA FORMAT", "error");
      } else {
          showToast("SERVER ERROR - TRY AGAIN", "error");
      }
  } catch { 
      showToast("NETWORK ERROR - CHECK CONNECTION", "error"); 
    }
  }

  // Service Worker
  if('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js');
  }

  // Lazy Load Images with IntersectionObserver
  if('IntersectionObserver' in window) {
    const imgObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting) {
          const img = entry.target;
          img.src = img.dataset.src;
          img.classList.remove('lazy');
          imgObserver.unobserve(img);
        }
      });
    });
    
    const observeImages = () => {
      document.querySelectorAll('img.lazy').forEach(img => imgObserver.observe(img));
    };
    observeImages();
  } else {
    // Fallback for older browsers
    document.querySelectorAll('img.lazy').forEach(img => {
      img.src = img.dataset.src;
      img.classList.remove('lazy');
    });
  }

  // Lazy load external libraries
  let markedLoaded = false;
  let prismLoaded = false;

  async function loadMarked() {
    if(markedLoaded) return;
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/marked/11.1.1/marked.min.js';
      script.onload = () => { markedLoaded = true; resolve(); };
      document.head.appendChild(script);
    });
  }

  async function loadPrism() {
    if(prismLoaded) return;
    return new Promise((resolve) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css';
      document.head.appendChild(link);
      
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/prism.min.js';
      script.onload = () => { prismLoaded = true; resolve(); };
      document.head.appendChild(script);
    });
  }

  async function initApp() {
    const path = window.location.pathname;
    
    // Show content immediately, fetch data in background
    if (path.startsWith('/post/')) {
      switchView('single', false);
    } else if (path.startsWith('/archive')) {
      switchView('archive', false);
    } else if (path.startsWith('/admin')) {
      switchView('admin', false);
    } else {
      switchView('home', false);
    }
    
    // Hide loader immediately
    document.getElementById('hourglassLoader').classList.add('hidden');
    
    // Fetch data in background
    await fetchData();
    
    // Handle post view after data loads
    if (path.startsWith('/post/')) {
      const postId = path.split('/')[2];
      await loadMarked();
      await loadPrism();
      openPost(postId, false);
    }
  }

  // Start immediately, don't wait for full page load
  if(document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initApp);
  } else {
    initApp();
  }
</script>

  

  </body>
</html>
`;
