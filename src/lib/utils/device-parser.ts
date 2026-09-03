import { UAParser } from "ua-parser-js";

export interface ParsedDeviceInfo {
    browser: string;
    os: string;
    deviceType: "mobile" | "tablet" | "desktop";
    label: string;
}

export function parseUserAgent(userAgent?: string | null): ParsedDeviceInfo {
    if (!userAgent) {
        return {
            browser: "Unknown Browser",
            os: "Unknown OS",
            deviceType: "desktop",
            label: "Unknown Device",
        };
    }

    const parser = new UAParser(userAgent);
    const browserResult = parser.getBrowser();
    const osResult = parser.getOS();
    const deviceResult = parser.getDevice();

    const browser = browserResult.name
        ? `${browserResult.name}${browserResult.version ? ` ${browserResult.version.split(".")[0]}` : ""}`
        : "Unknown Browser";

    const os = osResult.name
        ? `${osResult.name}${osResult.version ? ` ${osResult.version}` : ""}`
        : "Unknown OS";

    let deviceType: "mobile" | "tablet" | "desktop" = "desktop";
    if (deviceResult.type === "mobile") {
        deviceType = "mobile";
    } else if (deviceResult.type === "tablet") {
        deviceType = "tablet";
    }

    const label = `${browser} on ${os}`;

    return {
        browser,
        os,
        deviceType,
        label,
    };
}
