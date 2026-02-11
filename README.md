# Family Tech Literacy Workshop — Landing Page

React + Tailwind landing page built with Vite, deployable to GitHub Pages.

## Local dev

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
npm run preview
```

## Deploy to GitHub Pages

This repo includes a GitHub Actions workflow at `.github/workflows/deploy.yml`.

### Important: base path (GitHub Pages)

This site will deploy to:
`https://chipgptbiz.github.io/tech-literacy-workshop/`

So Vite must build with a base of:
`/tech-literacy-workshop/`

The Vite base path is **hard-coded** in `vite.config.ts` to `/tech-literacy-workshop/`.

If you later move to a **custom domain**, we’ll switch the base back to `/` and add a `public/CNAME` file.

### Enable Pages

In GitHub:
- Settings → Pages
- Build and deployment → Source: **GitHub Actions**

Then push to `main`.
