# Hypoteq Funnel Iframe Integration Guide

This guide explains how to embed the Hypoteq mortgage funnel as an iframe on a partner website and how to track the source of each lead.

## How It Works
- Partners embed your funnel as an iframe on their website.
- The source website is tracked using a `ref` query parameter in the iframe URL.
- When a user submits a lead, the source is stored and visible in your admin panel.

## Embedding the Iframe
To embed the funnel, partners should use the following HTML snippet:

```
<iframe
  src="https://your-hypoteq-domain.com/funnel-iframe?ref=the-eksperts.com"
  width="100%"
  height="900"
  style="border:none;"
  title="Hypoteq Mortgage Funnel"
  allowfullscreen
></iframe>
```

- Replace `the-eksperts.com` with the partner's domain or identifier.
- Adjust `width` and `height` as needed for your layout.

## Example: the-eksperts.com
For the partner website `the-eksperts.com`, use:

```
<iframe
  src="https://your-hypoteq-domain.com/funnel-iframe?ref=the-eksperts.com"
  width="100%"
  height="900"
  style="border:none;"
  title="Hypoteq Mortgage Funnel"
  allowfullscreen
></iframe>
```

## How Tracking Works
- The `ref` parameter is automatically captured and stored with each lead.
- In your admin panel, you will see a column showing the partner/source for every lead.

## Notes
- Make sure the iframe URL uses your production domain.
- You can use any string for the `ref` parameter to identify the source (e.g., domain, campaign name).
- If you need to track additional data, you can add more query parameters as needed.

## Support
For questions or help with integration, contact the Hypoteq technical team.
