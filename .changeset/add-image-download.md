---
'gh-download-issue': minor
---

Add image downloading and validation support

- Automatically download embedded images from issues and comments
- Validate images by checking magic bytes (PNG, JPEG, GIF, WebP, BMP, ICO, SVG)
- Update markdown to reference locally downloaded images
- Add JSON output format support (--format json)
- Add --download-images flag (default: true, use --no-download-images to skip)
- Add --verbose flag for detailed logging
- Handle GitHub URL redirects and S3 signed URLs
- Gracefully handle missing/expired image URLs with warnings
- Create issue-{number}-images/ directory for downloaded images
