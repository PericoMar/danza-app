const path = require("path");
const { getDefaultConfig } = require("@expo/metro-config");

const config = getDefaultConfig(__dirname);

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// video/ is the Remotion project behind public/og-video.mp4, with its own
// node_modules. The app never imports it, so Metro shouldn't crawl it.
const VIDEO_PROJECT = new RegExp(`^${escapeRegExp(path.join(__dirname, "video"))}\\/.*`);

config.resolver.blockList = [config.resolver.blockList, VIDEO_PROJECT];

module.exports = config;
