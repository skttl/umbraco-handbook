---
title: Review and publish
description: Follow a simple editorial approval flow.
order: 1
---
# Review and publish

Writers prepare content. Editors review it and publish when it is ready.

## Approval flow

```mermaid
flowchart TD
    A[Write a draft] --> B[Save and preview]
    B --> C{Ready for review?}
    C -->|No| A
    C -->|Yes| D[Editor reviews]
    D --> E{Approved?}
    E -->|Changes needed| A
    E -->|Yes| F[Publish]
```

## After publishing

Open the public page and confirm that the title, images and links look correct.
If you find a mistake, update the post and publish the correction.

[Back to the handbook](../README.md)
