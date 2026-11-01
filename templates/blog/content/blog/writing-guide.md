---
title: Writing Guide for This Blog
description: How to write posts that load instantly and rank, covering frontmatter, images, links and FAQs.
date: {{date}}
tags: [intro, guide]
faq:
  - Where do images go? :: Next to the Markdown file, or in public/.
  - How do I hide a draft? :: Add draft: true to the frontmatter.
---

## Frontmatter

Every post needs a `title` (under 60 characters) and a `description` (under 160). `velocita audit` warns when they are missing, too long or duplicated.

## Images

Put `photo.jpg` next to the post and write `![What the photo shows](photo.jpg)`. Width, height, lazy loading and responsive sizes are added for you.

## Links

Link related posts to each other, like this link back to [Hello World](/blog/hello-world/). The audit suggests links you are missing.
