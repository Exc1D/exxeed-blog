EXXEED | The Mission Log

Serverless Single-File CMS & Portfolio

EXXEED is a lightweight, high-performance blogging platform and portfolio site built on Cloudflare Workers. It features a distinct Military/Cyberpunk aesthetic, a built-in content management system (CMS), and a dual-theme engine, all contained within a single JavaScript file.
⚡ Tech Stack

    Runtime: Cloudflare Workers (Serverless JavaScript)

    Database: Cloudflare KV (Key-Value Storage)

    Frontend: HTML5, CSS3 (CSS Variables), Vanilla JavaScript

    Deployment: Wrangler CLI

🚀 Installation & Deployment
1. Prerequisites

    Node.js installed.

    Cloudflare Account.

    Wrangler installed globally: npm install -g wrangler

2. Project Setup

Initialize a folder and login to Cloudflare:
code Bash

    
mkdir exxeed-blog
cd exxeed-blog
wrangler login

  

3. Database Setup (KV)

Create the Key-Value namespace to store your blog posts:
code Bash

    
wrangler kv:namespace create EXXEED_DB

  

Copy the id outputted by this command.
4. Configuration (wrangler.toml)

Create a file named wrangler.toml in the root directory:
code Toml

    
name = "exxeed-blog"
main = "src/index.js"
compatibility_date = "2024-12-02"

[[kv_namespaces]]
binding = "BLOG_KV"
id = "PASTE_YOUR_KV_ID_HERE"

[vars]
ADMIN_PASS = "YourStrongPasswordHere"

  

5. Deploy

Run the deploy command:
code Bash

    
wrangler deploy

  

Your site will be live at https://exxeed-blog.<your-subdomain>.workers.dev.
📂 Architecture

The system is a Monolith Worker. A single script (src/index.js) handles:

    The Backend: Intercepts HTTP requests to /api/* to fetch or save data to KV.

    The Frontend: Returns the complete HTML/CSS/JS string for all other routes.

Logical Flow

    Request comes in.

    Is it an API request?

        GET /api/posts -> Return JSON from KV.

        POST /api/posts -> Validate Password -> Save JSON to KV.

    Is it a Browser request?

        Render the HTML template.

🎨 Customization
1. Changing the Avatar

Search for dossier-avatar in the HTML section or look for the img tag inside dossier-grid.
code Html

    
<img src="YOUR_IMAGE_URL.jpg" ... >

  

2. Editing the Timeline

At the very top of src/index.js, modify the TIMELINE_DATA array:
code JavaScript

    
const TIMELINE_DATA = [
  {
    year: "2025",
    title: "My New Job",
    desc: "Description here..."
  },
  // ...
];

  

3. Theming (CSS)

The theme engine uses CSS variables defined in the <style> block.

    Light Mode (Military): Defined in :root.

    Dark Mode (Cyber): Defined in [data-theme="dark"].

To change the "Cyan" X logo color, edit --logo-x in the CSS.
🔐 Admin & CMS Features
Accessing the Admin Panel

    Click the Lock Icon in the navigation bar.

    You will be presented with an "Encrypted Connection Required" gate.

    Enter the password defined in your wrangler.toml (ADMIN_PASS).

    Once authenticated, the dashboard unlocks.

creating/Editing Posts

    Create: Fill out the form and click "Submit Log".

    Edit: Click the [EDIT] link next to any post in the list below the form.

    HTML Support: The "Content" text area supports HTML tags (e.g., <b>, <br>, <code>, <img>) for rich text formatting.

📡 API Reference
Method	Endpoint	Auth Required	Description
GET	/api/posts	No	Fetches all blog posts. Cached for 60s.
GET	/api/timeline	No	Fetches timeline data.
POST	/api/posts	Yes	Creates a new post. Requires Authorization header.
PUT	/api/posts	Yes	Updates an existing post. Requires Authorization header.
🛠 Troubleshooting

"Unauthorized" Error when saving:

    Ensure the password you typed matches the ADMIN_PASS in your wrangler.toml.

    If you changed the password in wrangler.toml, you must run wrangler deploy again.

Posts disappear:

    Cloudflare KV is eventually consistent. If you save a post and refresh immediately, it might take a second to appear.

    Ensure your BLOG_KV binding ID is correct in wrangler.toml.

Images not loading:

    Ensure you are using a direct link to the image (ending in .jpg, .png, etc.), not a webpage link.

📜 License

Private / Personal Use.
Built by EXXEED.
