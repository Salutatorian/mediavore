# Inspiration & independence

Mediavore exists in the same **problem space** as other “paste a URL, get a file” tools. [Cobalt](https://github.com/imputnet/cobalt) is a well-known open project in that space and is useful **as a category reference** (how complex deployments, docs, and UX expectations look at scale).

**This repository is not derived from Cobalt’s codebase.**

- Cobalt’s API is **AGPL-3.0** and is implemented in **Node (Express)** with its own processing pipeline, tunnel/redirect/picker response model, and dependencies such as **YouTube.js** (InnerTube-style access) per their public README/docs.
- Mediavore is **Python (FastAPI)** and uses **yt-dlp** as the primary extraction engine, a **different URL normalization strategy**, a **different HTTP API layout**, and a **different UI/design system** (“Fluid-Dark” / Mediavore).

We only looked at **public documentation** (e.g. high-level API docs and README) to understand what “good” looks like for operators and users—not to mirror request/response shapes, error codes, or implementation details.

If you contribute to Mediavore:

- Do **not** paste or port Cobalt source into this repo.
- If you need behavior “like” another product, describe the **requirement** and implement it **fresh** here (or use permissively licensed libraries with compatible licenses and attribution as required).
