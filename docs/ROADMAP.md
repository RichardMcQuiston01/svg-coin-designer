# ROADMAP

## Future Enhancements

- [ ] Template system for pre-designed coins (Christmas, Birthday, etc.)
- [ ] AI-powered background removal integration
- [ ] Advanced image editing controls
- [x] Custom font selection - the Display Settings panel offers Sans Serif, Serif, and
      Monospace; see [QUICK_START.md](QUICK_START.md#add-or-change-a-font-option) to add
      more
- [ ] Color options for non-laser applications
- [ ] Save/load designs - Display Settings (portrait size, font, text offset) already
      persist to `localStorage`; the design content (text and portraits) does not yet
- [ ] Multiple coin size presets
- [ ] Batch processing
- [ ] Docker Container Demo
- [ ] Pre-processing of Images for Laser Engraving
- [x] Convert exported curved text to outline paths, so it does not depend on the laser
      software's own font substitution or `<textPath>` support - see `glyphOutline.ts`
- [ ] Subset the vendored outline fonts to the glyphs curved text can actually contain,
      to shrink the ~1.1 MB they currently add to the build (see
      [TECHNOLOGY.md](TECHNOLOGY.md#known-gaps))

## Future AI Integration

For production use, consider integrating AI-based services for:
- [ ] Advanced background removal (e.g., remove.bg API)
- [ ] Smart cropping (e.g., Cloudinary AI)
- [ ] Portrait enhancement
