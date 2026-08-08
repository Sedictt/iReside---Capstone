import dotenv from "dotenv";
dotenv.config();

// Polyfill DOMMatrix for canvas/pdfjs-dist in JSDOM environment
if (typeof global.DOMMatrix === "undefined") {
    // @ts-ignore
    global.DOMMatrix = class DOMMatrix {};
}

import "@testing-library/jest-dom";
import { vi } from "vitest";
import React from "react";

// Mock next/image to prevent URL validation issues in JSDOM
vi.mock("next/image", () => ({
    __esModule: true,
    default: (props: any) => {
        const { src, alt, width, height, className, fill, ...rest } = props;
        return React.createElement("img", {
            src,
            alt,
            width: fill ? undefined : width,
            height: fill ? undefined : height,
            className,
            ...rest
        });
    },
}));

// Set up test environment variables
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-testing-purposes-only';
process.env.NEXT_PUBLIC_APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';


