# The Muscle Maid — Website

Static website for The Muscle Maid LLC. Pure HTML/CSS — no build step.

## Pages

- `index.html` — Home
- `services.html` — Services
- `about.html` — About
- `contact.html` — Contact

## Deploy to GitHub Pages

1. **Create a new GitHub repository** (e.g., `themusclemaid-site`).
2. **Upload the entire contents of this folder** to the root of the repository. The easiest way:
   - On GitHub, click **Add file → Upload files**
   - Drag every file and the `assets/` folder from this directory in
   - Commit
3. **Enable Pages**: Repo → **Settings → Pages** → under "Build and deployment", set **Source** to `Deploy from a branch`, **Branch** to `main` (or `master`) and folder to `/ (root)`. Save.
4. Wait ~1 minute. Your site will be live at:
   `https://<your-github-username>.github.io/<repo-name>/`

### Custom domain (optional)

If you have a domain (e.g., `themusclemaid.com`):
- In Repo → Settings → Pages, add the domain under **Custom domain**.
- At your domain registrar, point a CNAME for `www` to `<your-github-username>.github.io`, and add 4 A records for the apex domain (GitHub's IPs — Pages docs has the current list).

## File structure

```
website/
├── index.html
├── services.html
├── about.html
├── contact.html
├── styles.css
├── README.md
├── .nojekyll
└── assets/
    ├── favicon.svg
    ├── favicon.ico
    ├── favicon-16.png
    ├── favicon-32.png
    ├── apple-touch-icon.png
    ├── logo.svg
    ├── logo-tagline.svg
    └── hero-bucket.png
```

The `.nojekyll` file tells GitHub Pages to serve the files exactly as-is (no Jekyll processing).

## Future updates

- **Before/after photos**: To add a "See the Difference" gallery, drop photos in `assets/` and add a new section to `index.html`.
- **Pricing**: When you're ready to publish prices, add a section to `services.html` or a new `pricing.html` page using the existing `.service-card` styles.
- **Contact form**: Free options that work with static sites include Formspree, Getform, or Netlify Forms (if you host on Netlify instead).

## Brand reference

- **Colors** — Soft Blush `#FFEECE` · Maid Pink `#F7B9C5` · Rose Dust `#E7A1B1` · Clean Black `#111111` · Clean White `#FFFFFF`
- **Fonts** — Playfair Display (display/logo) · Montserrat (headings/body)
- **Vibe** — Strong. Feminine. Clean. Memorable.
