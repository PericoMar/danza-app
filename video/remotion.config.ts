import { Config } from "@remotion/cli/config";

// Small enough for a link preview to fetch eagerly, sharp enough for flat logos.
const CRF = 26;

Config.setEntryPoint("src/index.ts");
Config.setVideoImageFormat("jpeg");
Config.setCodec("h264");
Config.setCrf(CRF);
Config.setOverwriteOutput(true);
