# Diagrams

The `.svg` files are the source; the `.png` files are what the root `README.md` embeds
(rendered at 2x so they stay sharp on high-density screens).

To re-render a PNG after editing an SVG:

```
google-chrome --headless=new --disable-gpu --hide-scrollbars \
  --force-device-scale-factor=2 --window-size=<svg width>,<svg height> \
  --screenshot=<name>.png file://$PWD/<name>.svg
```

Palette and type follow `theme/colors.tsx` — keep new diagrams on the same tokens.
