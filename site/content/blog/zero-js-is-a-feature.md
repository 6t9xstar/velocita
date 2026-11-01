---
title: Why zero JavaScript is a feature
description: Content sites rarely need a client-side framework. Here is what shipping no JS by default buys you, and how to add interactivity anyway.
date: 2026-10-24
tags: [performance, islands]
---

## The cost you don't see

Every kilobyte of JavaScript is downloaded, parsed, compiled and executed before a page becomes fully responsive. On a mid-range phone that cost shows up directly in Interaction to Next Paint.

## What content sites actually need

Most pages of a blog, docs site or marketing site are text, images and links. HTML already does that perfectly. The few interactive parts, such as search, a copy button or a calculator, can be [islands](/docs/islands/) that load on their own.

## Measuring it

The [home page](/) runs a live meter that shows its own transfer size, JavaScript weight and Largest Contentful Paint in your browser. Then try [the 1.0 release notes](/blog/velocita-1-0/) to see what keeps those numbers low over time.
