Deployment options

GitHub Pages (recommended for simple static sites)

1. Create a repository on GitHub and push this folder as the repository root.

Commands (run from the workspace root):

```bash
git init
git add .
git commit -m "Initial site"
git branch -M main
git remote add origin https://github.com/<your-username>/<repo>.git
git push -u origin main
```

2. The included GitHub Actions workflow (.github/workflows/pages.yml) will run on push to `main` and publish the repository root to GitHub Pages. After the first successful run the site will be available at `https://<your-username>.github.io/<repo>/`.

Netlify (drag & drop quick deploy)

- Go to https://app.netlify.com/drop and drop the site folder (zip or files). Or connect your GitHub repo for continuous deploy.

Vercel

- Use https://vercel.com/import to import from GitHub and deploy instantly (best for JS frameworks, but works for static sites too).

Local server (quick preview)

```powershell
python -m http.server 8000
# Open http://localhost:8000/turing.html
```

Notes

- If you use a custom domain, add a `CNAME` file to the repo root after configuring DNS.
- The GitHub workflow publishes the repository root. If you prefer a specific folder, update the `path` in `.github/workflows/pages.yml` before pushing.
