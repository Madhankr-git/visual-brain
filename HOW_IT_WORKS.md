# Technical & Functional Architecture Report: Visual Brain

> **Purpose of this Document:**  
> This report provides an exhaustive, code-verified technical and functional breakdown of the **Visual Brain** codebase. It is designed to serve as the reference document for drafting the public-facing **"How It Works"** page.

---

## 1. Executive Summary & Core Concept

**Visual Brain** is a browser-local, zero-backend visual knowledge library for AI-generated imagery. 

Unlike traditional image repositories that treat images as static files or simple prompt galleries, Visual Brain treats each image as a **multidimensional node** within an interconnected knowledge network. It pairs visual assets with:
1. **Photographic & Cinematographic Anatomy** (Camera body/sensor, lens focal length, aperture, lighting setup, shadow contrast, framing & composition).
2. **AI Generation Recipes** (Engine/model, seed, and complete raw prompt with modifiers).
3. **Descriptive Vocabulary (Tags)** that form clustering anchors in a force-directed physics graph.

```
+-----------------------------------------------------------------------------------+
|                                  VISUAL BRAIN                                     |
|                                                                                   |
|   [ Photographic Anatomy ] + [ AI Prompt Recipe ] + [ Descriptive Vocabulary ]    |
|             \                       |                       /                     |
|              \                      |                      /                      |
|               v                     v                     v                       |
|           +---------------------------------------------------+                   |
|           |        Interconnected Visual Knowledge Node       |                   |
|           +---------------------------------------------------+                   |
|                                     |                                             |
|                                     v                                             |
|           +---------------------------------------------------+                   |
|           |       Bipartite Force-Directed Physics Graph      |                   |
|           |    (Images naturally cluster around shared tags)  |                   |
|           +---------------------------------------------------+                   |
+-----------------------------------------------------------------------------------+
```

---

## 2. Overall Application Workflow & Architecture

The application is structured as a client-side Single Page Application (SPA) built with **React 18** and **Vite**, adhering strictly to modern light-mode brutalist aesthetics (strict `0px` border-radius, `#38bdf8` / `#0284c7` solid primary accents, and zero CSS gradients).

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                                BROWSER WINDOW                                   │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Floating Navigation Bar (Brand, Global Search + 'Find', Gallery, Admin)   │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌─────────────────────────────────┐  ┌──────────────────────────────────────┐  │
│  │                                 │  │                                      │  │
│  │       PRIMARY LANDING VIEW      │  │        RIGHT-SIDE SLIDING DRAWER     │  │
│  │  100vw x 100vh Fullscreen Canvas │  │              (480px wide)            │  │
│  │                                 │  │                                      │  │
│  │   • Force-Directed Network      │  │   • Image Inspection Mode:           │  │
│  │   • Image Nodes (Avatars)       │  │     - Full visual preview            │  │
│  │   • Tag Hub Nodes (#tags)       │  │     - Technical photography specs    │  │
│  │   • Real-Time Physics Springs   │  │     - Copyable AI Prompt Recipe      │  │
│  │   • Pan, Zoom, Drag Interactivity│  │     - Connected Works reel           │  │
│  │                                 │  │                                      │  │
│  │                                 │  │   • Tag Cluster Mode:                │  │
│  │                                 │  │     - List of all tagged works       │  │
│  │                                 │  │     - 'Focus in Brain' action        │  │
│  └─────────────────────────────────┘  └──────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Overlays / Modals / Independent Views:                                     │  │
│  │  • Gallery Grid Overlay (/gallery)   • Dedicated Login (/login)           │  │
│  │  • Manifesto Page (/why-visual-brain)• Admin Upload Drawer                │  │
│  │  • Floating Help Button ('?')        • Floating HUD Controls (Zoom/Pause) │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
│                                                                                 │
│  ┌───────────────────────────────────────────────────────────────────────────┐  │
│  │ Local Client-Side Persistence Layer (IndexedDB: VisualBrainDB)             │  │
│  └───────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy
- **`App.jsx`**: Global orchestrator, state manager (`images`, `selectedImage`, `selectedTag`, `currentView`, `role`), and popstate routing handler.
- **`routes.js`**: Centralized path resolver (`ROUTES.HOME`, `ROUTES.GALLERY`, `ROUTES.ADMIN`, `ROUTES.LOGIN`, `ROUTES.WHY_VISUAL_BRAIN`).
- **`storage.js`**: Native browser IndexedDB transaction engine (`VisualBrainDB`) with automated `localStorage` fallback.
- **`NetworkGraph.jsx`**: HTML5 Canvas rendering engine with custom spring-repulsion physics simulation.
- **`ImageDetailPanel.jsx`**: Docked 480px right-side drawer displaying technical analysis or tag cluster lists.
- **`Navbar.jsx`**: Floating top navigation bar with search form and view triggers.
- **`GalleryGrid.jsx` & `ImageCard.jsx`**: Filterable visual archive overlay.
- **`LoginPage.jsx` & `auth.js`**: Protected authentication barrier for administrative operations.
- **`WhyVisualBrainPage.jsx`**: Dedicated philosophical manifesto page.
- **`HelpFloatingButton.jsx`**: Persistent `?` button expanding on hover to reveal manifesto entry.

---

## 3. Step-by-Step Image Lifecycle

### A. Creation & Ingestion (`UploadModal.jsx`)
Images enter Visual Brain exclusively through administrative input:
1. **Asset Upload**:
   - **Local File Input**: User selects or drags a local file (`PNG`, `JPG`, `WEBP`, `GIF`). A `FileReader` converts it to an encoded Base64 Data URL (`readAsDataURL`).
   - **Remote URL Input**: Alternatively, a direct web image link can be entered.
2. **Metadata Documentation**:
   The admin completes structured documentation fields partitioned into 4 categories:
   - **Identity**: `title` (required), `description`.
   - **AI Recipe**: `aiPrompt`, `aiModel` (autocomplete suggestions: Midjourney, Flux.1, SD 3.5, etc.), `aiSeed`.
   - **Photographic Attributes**: `camera`, `lens`, `aperture`, `lighting`, `shadows`, `composition`.
   - **Taxonomy**: `tags` array (input via comma or Enter; includes suggestion chips of existing library tags).

### B. Storage & Data Structure (`storage.js`)
- **Engine**: Browser **IndexedDB** (`Database: "VisualBrainDB"`, `ObjectStore: "images"`, `Version: 1`).
- **Indices**: Indexed by `id` (primary key), `createdAt`, and `title`.
- **Why IndexedDB**: Standard `localStorage` has a strict ~5MB quota that fails after saving only 1 or 2 high-resolution Base64 images. IndexedDB allocates hundreds of megabytes or gigabytes locally without an external server.
- **Fallback**: If IndexedDB is blocked or unsupported, it falls back to `localStorage` with quota error handling.

#### Verified Schema:
```typescript
interface VisualBrainImage {
  id: string;               // e.g., "vb-1732204910-x8k2m9p" or "vb-sample-1"
  title: string;            // e.g., "Monolithic Void in Neo-Shinjuku"
  description: string;      // Creative narrative & artistic context
  imageUrl: string;         // Base64 Data URI or HTTPS image URL
  tags: string[];           // Array of lowercase strings: ["cyberpunk", "cinematic", "neon"]
  camera: string;           // e.g., "Sony A7R V"
  lens: string;             // e.g., "35mm f/1.4 GM Prime"
  aperture: string;         // e.g., "f/1.4"
  lighting: string;         // e.g., "Dual-tone volumetric cyan rim light..."
  shadows: string;          // e.g., "Deep pitch silhouettes with atmospheric haze..."
  composition: string;      // e.g., "Centered vertical monolith with dramatic one-point..."
  aiPrompt: string;         // Full prompt with parameters (--ar 16:9 --v 6.1)
  aiModel: string;          // e.g., "Midjourney v6.1"
  aiSeed: string;           // e.g., "482019385"
  createdAt: string;        // ISO 8601 Timestamp
  updatedAt?: string;       // ISO 8601 Timestamp (on updates)
}
```

### C. Retrieval & State Hydration
- On initial mount, `App.jsx` calls `StorageService.init()`.
- If the store is empty, it automatically seeds 6 curated sample artworks (`sampleData.js`) covering varied cinematographic styles (Cyberpunk, Macro Bioluminescence, Brutalist Desert, Sci-Fi Twilight, Submerged Classical Sculpture, Chromatic Mirage).
- The returned image array is sorted chronologically descending (`b.createdAt - a.createdAt`).

### D. Modification & Deletion
- **Update**: `StorageService.updateImage(id, updates)` updates the entry and marks `updatedAt`.
- **Delete**: `StorageService.deleteImage(id)` deletes the entry from IndexedDB. Restricted strictly to authenticated administrators.
- **Reset**: `StorageService.resetData()` clears the object store and re-seeds default samples.

---

## 4. Admin-to-Public Publishing & Access Control Workflow

Visual Brain enforces strict role-based separation between public visitors and administrators:

```
[ Visitor enters '/' ] ──────────> Viewer Role (Read-Only)
                                   • Canvas & Gallery Exploration
                                   • Inspect Metadata & Prompts
                                   • No Admin Buttons Visible

[ Operator enters '/login' ] ────> Authentication Barrier
                                   • madhankr2kdec@gmail.com
                                   • madhankr27@visualbrain
                                           │
                                     (Validation)
                                           v
[ Redirect to '/admin' ] ────────> Administrator Role
                                   • ADMIN MODE Badge Enabled
                                   • Upload Modal Enabled (+ Upload Image)
                                   • Image Deletion Enabled
                                   • Sample Database Reset Enabled
```

| Feature / Action | Public Viewer (`/`, `/gallery`) | Administrator (`/admin`, `/admin/gallery`) |
| :--- | :---: | :---: |
| **Visual Brain Network Canvas** | Full Access | Full Access |
| **Inspect Details & Copy Prompts** | Full Access | Full Access |
| **Filter by Tags & Global Search** | Full Access | Full Access |
| **Archive Gallery Grid Overlay** | Full Access | Full Access |
| **Upload New Visuals** | **Hidden & Blocked** | **Full Access** (`+ Upload Image`) |
| **Delete Existing Visuals** | **Hidden & Blocked** | **Full Access** (Trash icon in panel) |
| **Reset Database to Default** | **Hidden & Blocked** | **Full Access** (`Reset Samples`) |
| **Visibility of Admin Links** | **Zero UI Footprint** | Active `ADMIN MODE` Badge + `Exit Admin` |

### Verified Authentication Mechanism (`auth.js`):
- **Hardcoded Verification**: Evaluates submitted credentials against `madhankr2kdec@gmail.com` and `madhankr27@visualbrain`.
- **Session Storage**: Saves a JSON session object under the key `vb_admin_session` in both `sessionStorage` and `localStorage`.
- **Routing Protection**: Entering `/admin` unauthenticated automatically triggers the `/login` page. Calling `handleLogout()` clears storage keys and redirects the user to `/`.

---

## 5. Tagging, Vocabulary & Relationship Logic

The core philosophy of Visual Brain is that **individual images should not exist in isolation**. Connections are established through shared vocabulary:

### A. Tag Extraction & Aggregation
Tags are plain strings (e.g., `"cyberpunk"`, `"macro"`, `"cinematic"`, `"volumetric"`).
In `App.jsx`, a reactive `useMemo` hook aggregates tags across all stored images:
```javascript
const allTags = useMemo(() => {
  const tagCount = new Map();
  images.forEach((img) => {
    (img.tags || []).forEach((t) => {
      tagCount.set(t, (tagCount.get(t) || 0) + 1);
    });
  });
  return Array.from(tagCount.entries())
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([tag]) => tag);
}, [images]);
```
- **Frequency Ranking**: Tags are sorted descending by frequency of use, then alphabetically.
- **Dynamic Growth**: Adding a new image with unique tags automatically introduces new nodes into the network.

### B. Image-to-Image Relatedness Calculation (`ImageDetailPanel.jsx`)
When inspecting any image $A$, related images are computed on the fly through set intersection:
$$\text{SharedTags}(A, B) = \text{Tags}(A) \cap \text{Tags}(B)$$
1. Filter out self ($B \neq A$).
2. Count overlapping tags.
3. Filter where $|\text{SharedTags}| > 0$.
4. Sort descending by the number of shared tags.
5. Displayed in the right-side drawer as the **"Connected Works"** reel.

### C. Tag Cluster Exploration
When clicking a tag node in the graph (or a tag pill anywhere in the UI):
- The right panel opens in **Tag Cluster Mode**.
- Displays every image containing that tag along with its camera, lens, and AI model specs.
- Clicking any item navigates directly to that image's technical breakdown.

---

## 6. Visual Knowledge Graph Engine (`NetworkGraph.jsx`)

The centerpiece of Visual Brain is an interactive, force-directed bipartite graph rendered on an HTML5 `<canvas>`.

### A. Bipartite Node-Link Model
The graph generates two distinct categories of nodes:
1. **Image Nodes**:
   - `id`: `img-${image.id}`
   - `radius`: 28px
   - `rendering`: Base circle + clipped circular thumbnail image + cyan/slate border ring + title label.
2. **Tag Hub Nodes**:
   - `id`: `tag-${tagName}`
   - `radius`: 18px
   - `rendering`: Pill/circle badge + monospace `#tag` text.
3. **Edges (Links)**:
   - Established between an Image node and a Tag node:
     $$\text{Edge}(I, T) \iff T \in \text{Tags}(I)$$
   - *Direct image-to-image edges are intentionally omitted.* Instead, images sharing multiple tags naturally cluster around their common tag hub nodes through physical spring forces.

```
      [Image Node A]                 [Image Node B]
            \                               /
             \                             /
              v                           v
          +-----------------------------------+
          |     Tag Hub Node: #cyberpunk      |
          +-----------------------------------+
              ^                           ^
             /                             \
            /                               \
      [Image Node C]                 [Image Node D]

  (Shared tags pull related visual works into natural aesthetic clusters)
```

### B. Physics Engine Formulation
The canvas executes a 60 FPS physics simulation loop via `requestAnimationFrame`:
1. **Coulomb Repulsion (Anti-Collision)**:
   All nodes repel each other to prevent visual overlap:
   $$F_{\text{repel}} = \frac{(r_a + r_b + 36)^2 \cdot 45}{d^2}$$
2. **Hooke's Spring Attraction (Link Tension)**:
   Edges pull images and their descriptive tags together:
   $$F_{\text{spring}} = (d - \text{restDistance}) \cdot 0.035 \quad (\text{where } \text{restDistance} = 95\text{px})$$
3. **Centering Gravity**:
   A gentle linear restorative force pulls outlying nodes toward the origin $(0, 0)$:
   $$F_{\text{center}} = -0.004 \cdot \mathbf{x}$$
4. **Velocity Damping**:
   Velocities are multiplied by `0.82` each tick, allowing the network to quickly settle into an organic, stabilized equilibrium.

### C. Canvas Transform & Viewport Isolation
- **100% Screen Dimensions**: Sizes to `window.innerWidth` $\times$ `window.innerHeight`.
- **World-to-Screen Transformation**:
  $$\mathbf{x}_{\text{screen}} = \mathbf{x}_{\text{world}} \cdot k + \text{pan}_x$$
- **Native Non-Passive Wheel Event**: Wheel events are bound with `{ passive: false }` directly on the canvas element calling `e.preventDefault()` and `e.stopPropagation()`. This prevents the browser window from scrolling while zooming.
- **Continuous Exponential Zooming**:
  $$k_{\text{new}} = \text{clamp}\left(k \cdot 2^{-\Delta \cdot 0.0028},\, 0.3,\, 3.2\right)$$
  Zoom centers dynamically around the exact mouse cursor coordinates.

### D. Interactive Search Camera Pan
When a user searches from the navbar, the graph searches all image titles, prompts, camera bodies, and tag names. If a match is found:
- The camera executes an interpolated frame-by-frame pan that smoothly centers the matching node on the screen.
- Highlights the node and opens its details in the right-side panel.

---

## 7. User Exploration Journey

```
Visitor Lands at '/' (100% Fullscreen Canvas)
  │
  ├── 1. DISCOVERY VIA GRAPH
  │      • Pan/zoom around the universe of AI visuals.
  │      • Hover over nodes: Connected nodes illuminate in cyan; unrelated nodes dim.
  │      • Click Image Node ──> Opens Right-Side Technical Inspector (Canvas stays visible).
  │      • Click Tag Hub Node ──> Opens Right-Side Tag Cluster List.
  │
  ├── 2. DISCOVERY VIA SEARCH
  │      • Types "anamorphic" or "brutalist" in navbar and hits "Find".
  │      • Canvas smoothly animates to center on the matching visual/tag.
  │
  ├── 3. DISCOVERY VIA GALLERY
  │      • Clicks "Go to Gallery".
  │      • Responsive grid opens with tag filter chips.
  │      • Clicks any card ──> Opens Right-Side Technical Inspector.
  │
  └── 4. DEEP INSPECTION & LEARNING
         • Inspects camera emulation, lens, aperture, lighting, and shadow contrast.
         • Copies full raw prompt with 1 click.
         • Clicks a related work from "Connected Works" to continue exploration.
         • Clicks '?' in bottom right corner ──> Reads "Why Visual Brain?" philosophy.
```

---

## 8. Feature Audit: Verified Implemented vs. Planned / Incomplete

To ensure the "How It Works" documentation remains accurate, the following table distinguishes what is fully functional in the codebase from what does not exist:

| Feature / Capability | Status | Implementation Details |
| :--- | :---: | :--- |
| **Local Image Upload** | **VERIFIED IMPLEMENTED** | Drag-and-drop or file picker; converted to Base64 Data URL. |
| **IndexedDB Persistence** | **VERIFIED IMPLEMENTED** | Zero-dependency local persistence in `VisualBrainDB`. |
| **Structured Metadata Fields** | **VERIFIED IMPLEMENTED** | 10 distinct creative, photographic, and AI prompt fields. |
| **Interactive Canvas Graph** | **VERIFIED IMPLEMENTED** | 2D Canvas force-directed physics graph with zoom/pan/drag. |
| **Tag Hub Clustering** | **VERIFIED IMPLEMENTED** | Images naturally cluster around shared tag hub nodes. |
| **Interactive Search & Camera Pan** | **VERIFIED IMPLEMENTED** | Search pans camera to center on matched nodes. |
| **Right-Side Detail Panel** | **VERIFIED IMPLEMENTED** | 480px docked drawer for both image and tag cluster views. |
| **Prompt Clipboard Copying** | **VERIFIED IMPLEMENTED** | 1-click prompt copying with visual feedback ("Copied!"). |
| **Connected Works Reel** | **VERIFIED IMPLEMENTED** | Dynamic shared-tag intersection calculation. |
| **Role Separation & Login Page** | **VERIFIED IMPLEMENTED** | Public viewer at `/`; protected admin at `/admin` via `/login`. |
| **Light Mode Brutalist UI** | **VERIFIED IMPLEMENTED** | Strict `0 border-radius` and solid `#38bdf8` palette. |
| **Philosophy Page (`/why-visual-brain`)** | **VERIFIED IMPLEMENTED** | Complete manifesto article with persistent `?` trigger. |
| **Automated AI Tag Extraction** | **NOT IMPLEMENTED (BY DESIGN)** | All tags and metadata are entered manually by the admin. |
| **Cloud Database / Multi-User Sync** | **NOT IMPLEMENTED (BY DESIGN)** | Data resides strictly inside the user's local browser storage. |
| **Direct Image-to-Image Links in Graph** | **NOT IMPLEMENTED (BY DESIGN)** | Links exist between Images and Tags (Bipartite). Direct image links are shown in the sidebar. |
| **Image Edit / Re-upload in Place** | **INCOMPLETE / PARTIAL** | `StorageService.updateImage` exists in code, but no UI form is wired for updating an existing image (only upload and delete). |

---

## 9. Important Technical Limitations

1. **Browser-Local Storage Isolation**:
   - Because data is stored in browser IndexedDB, uploads made on one computer or browser will **not** automatically sync to another computer or browser.
   - Clearing browser cache/site data wipes custom uploaded images (though default samples will re-seed).
2. **Memory Footprint of Base64 Images**:
   - High-resolution images uploaded from the computer are stored as raw Base64 strings. While IndexedDB handles this well, storing hundreds of 10MB+ images will increase browser memory usage during canvas texture pre-caching (`imageBitmapsRef`).
3. **Client-Side Authentication**:
   - Administrative protection evaluates credentials on the client side (`AuthService.login`). While effective for prototype demonstration, production deployment with sensitive data will eventually require a backend auth provider.

---

## 10. Key Insights for Writing the "How It Works" Public Page

When explaining Visual Brain to a first-time visitor, emphasize these core takeaways:

1. **"Images Are Not Just Pictures—They Are Recipes"**:
   Every visual is documented across two dimensions: the **optical technique** (real-world camera lenses, apertures, lighting setups, and shadows) and the **synthetic generation** (AI model, seed, and prompt syntax).
2. **"Tags Are Not Just Labels—They Are Connective Tissue"**:
   In Visual Brain, a tag is not a flat filter. It is an active gravitational node in a visual network. When multiple images share techniques (like `#anamorphic`, `#brutalism`, or `#volumetric`), they physically draw near each other in the graph.
3. **"Look Beyond Prompt Copying"**:
   Visual Brain shifts users from blindly copying prompt strings to understanding *why* an image works—enabling them to master lighting, lens choice, and composition for their own creative work.