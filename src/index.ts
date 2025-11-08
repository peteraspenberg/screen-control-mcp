#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from "@modelcontextprotocol/sdk/types.js";
// @ts-ignore - screenshot-desktop doesn't have type definitions
import screenshot from "screenshot-desktop";
import * as robot from "robotjs";
import * as fs from "fs/promises";
import * as path from "path";
import { fileURLToPath } from "url";

interface ScreenInfo {
  id: number;
  name?: string;
  width: number;
  height: number;
  x: number;
  y: number;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize robotjs
robot.setMouseDelay(2);
robot.setKeyboardDelay(10);

class ScreenControlServer {
  private server: Server;
  private screenshotDir: string;

  constructor() {
    this.server = new Server(
      {
        name: "screen-control-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    // Create temp directory for screenshots
    this.screenshotDir = path.join(__dirname, "../temp");
    this.setupHandlers();
  }

  private async ensureScreenshotDir() {
    try {
      await fs.mkdir(this.screenshotDir, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: "list_screens",
            description:
              "List all available screens/displays on the system",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "capture_screen",
            description:
              "Capture a screenshot of a specific screen or all screens. Returns the screenshot as base64 data URI.",
            inputSchema: {
              type: "object",
              properties: {
                screenId: {
                  type: "number",
                  description:
                    "Screen ID to capture (0-indexed). If not provided, captures all screens.",
                },
                format: {
                  type: "string",
                  enum: ["png", "jpg"],
                  description: "Image format (default: png)",
                  default: "png",
                },
              },
            },
          },
          {
            name: "get_screen_info",
            description:
              "Get information about all screens (resolution, position, etc.)",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
          {
            name: "move_mouse",
            description: "Move the mouse cursor to specified coordinates",
            inputSchema: {
              type: "object",
              properties: {
                x: {
                  type: "number",
                  description: "X coordinate",
                },
                y: {
                  type: "number",
                  description: "Y coordinate",
                },
                screenId: {
                  type: "number",
                  description:
                    "Screen ID (0-indexed). If not provided, uses primary screen coordinates.",
                },
              },
              required: ["x", "y"],
            },
          },
          {
            name: "click_mouse",
            description: "Click the mouse at specified coordinates",
            inputSchema: {
              type: "object",
              properties: {
                x: {
                  type: "number",
                  description: "X coordinate",
                },
                y: {
                  type: "number",
                  description: "Y coordinate",
                },
                button: {
                  type: "string",
                  enum: ["left", "right", "middle"],
                  description: "Mouse button to click (default: left)",
                  default: "left",
                },
                doubleClick: {
                  type: "boolean",
                  description: "Perform double click (default: false)",
                  default: false,
                },
                screenId: {
                  type: "number",
                  description:
                    "Screen ID (0-indexed). If not provided, uses primary screen coordinates.",
                },
              },
              required: ["x", "y"],
            },
          },
          {
            name: "scroll_mouse",
            description: "Scroll the mouse wheel",
            inputSchema: {
              type: "object",
              properties: {
                x: {
                  type: "number",
                  description: "X coordinate",
                },
                y: {
                  type: "number",
                  description: "Y coordinate",
                },
                direction: {
                  type: "string",
                  enum: ["up", "down", "left", "right"],
                  description: "Scroll direction",
                },
                clicks: {
                  type: "number",
                  description: "Number of scroll clicks (default: 3)",
                  default: 3,
                },
                screenId: {
                  type: "number",
                  description:
                    "Screen ID (0-indexed). If not provided, uses primary screen coordinates.",
                },
              },
              required: ["x", "y", "direction"],
            },
          },
          {
            name: "type_text",
            description:
              "Type text at the current cursor position or specified coordinates",
            inputSchema: {
              type: "object",
              properties: {
                text: {
                  type: "string",
                  description: "Text to type",
                },
                x: {
                  type: "number",
                  description:
                    "Optional X coordinate to click before typing. If not provided, types at current cursor position.",
                },
                y: {
                  type: "number",
                  description:
                    "Optional Y coordinate to click before typing. If not provided, types at current cursor position.",
                },
                screenId: {
                  type: "number",
                  description:
                    "Screen ID (0-indexed). If not provided, uses primary screen coordinates.",
                },
              },
              required: ["text"],
            },
          },
          {
            name: "press_key",
            description: "Press a key or key combination",
            inputSchema: {
              type: "object",
              properties: {
                key: {
                  type: "string",
                  description:
                    "Key to press (e.g., 'enter', 'tab', 'space', 'cmd+c', 'ctrl+shift+t')",
                },
              },
              required: ["key"],
            },
          },
          {
            name: "get_mouse_position",
            description: "Get the current mouse cursor position",
            inputSchema: {
              type: "object",
              properties: {},
            },
          },
        ] as Tool[],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "list_screens":
            return await this.listScreens();

          case "capture_screen":
            return await this.captureScreen(
              args?.screenId as number | undefined,
              (args?.format as string) || "png"
            );

          case "get_screen_info":
            return await this.getScreenInfo();

          case "move_mouse":
            return await this.moveMouse(
              args?.x as number,
              args?.y as number,
              args?.screenId as number | undefined
            );

          case "click_mouse":
            return await this.clickMouse(
              args?.x as number,
              args?.y as number,
              args?.button as string | undefined,
              args?.doubleClick as boolean | undefined,
              args?.screenId as number | undefined
            );

          case "scroll_mouse":
            return await this.scrollMouse(
              args?.x as number,
              args?.y as number,
              args?.direction as string,
              args?.clicks as number | undefined,
              args?.screenId as number | undefined
            );

          case "type_text":
            return await this.typeText(
              args?.text as string,
              args?.x as number | undefined,
              args?.y as number | undefined,
              args?.screenId as number | undefined
            );

          case "press_key":
            return await this.pressKey(args?.key as string);

          case "get_mouse_position":
            return await this.getMousePosition();

          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        return {
          content: [
            {
              type: "text",
              text: `Error: ${errorMessage}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  private async listScreens() {
    try {
      const screens = await screenshot.listDisplays();
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                count: screens.length,
                screens: screens.map((screen: any, index: number) => ({
                  id: index,
                  name: screen.name || `Screen ${index + 1}`,
                  width: screen.width,
                  height: screen.height,
                  x: screen.x,
                  y: screen.y,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list screens: ${error}`);
    }
  }

  private async captureScreen(
    screenId?: number,
    format: string = "png"
  ): Promise<{
    content: Array<{ type: string; data?: string; text?: string }>;
  }> {
    await this.ensureScreenshotDir();

    try {
      let img: Buffer;
      let screens: any[];

      if (screenId !== undefined) {
        screens = await screenshot.listDisplays();
        if (screenId < 0 || screenId >= screens.length) {
          throw new Error(`Invalid screen ID: ${screenId}`);
        }
        img = await screenshot({ screen: screenId });
      } else {
        // Capture all screens
        img = await screenshot({ screen: -1 });
      }

      // Convert to base64 data URI
      const base64 = img.toString("base64");
      const mimeType = format === "jpg" ? "image/jpeg" : "image/png";
      const dataUri = `data:${mimeType};base64,${base64}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              format,
              dataUri,
              size: img.length,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to capture screen: ${error}`);
    }
  }

  private async getScreenInfo() {
    try {
      const screens = await screenshot.listDisplays();
      const screenSize = robot.getScreenSize();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                primaryScreen: {
                  width: screenSize.width,
                  height: screenSize.height,
                },
                displays: screens.map((screen: any, index: number) => ({
                  id: index,
                  name: screen.name || `Display ${index + 1}`,
                  width: screen.width,
                  height: screen.height,
                  x: screen.x,
                  y: screen.y,
                  isPrimary: index === 0,
                })),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get screen info: ${error}`);
    }
  }

  private async moveMouse(
    x: number,
    y: number,
    screenId?: number
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      let finalX = x;
      let finalY = y;

      if (screenId !== undefined) {
        const screens = await screenshot.listDisplays();
        if (screenId < 0 || screenId >= screens.length) {
          throw new Error(`Invalid screen ID: ${screenId}`);
        }
        const screen = screens[screenId];
        // Adjust coordinates for multi-screen setup
        finalX = screen.x + x;
        finalY = screen.y + y;
      }

      robot.moveMouse(finalX, finalY);
      const pos = robot.getMousePos();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              position: { x: pos.x, y: pos.y },
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to move mouse: ${error}`);
    }
  }

  private async clickMouse(
    x: number,
    y: number,
    button: string = "left",
    doubleClick: boolean = false,
    screenId?: number
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      let finalX = x;
      let finalY = y;

      if (screenId !== undefined) {
        const screens = await screenshot.listDisplays();
        if (screenId < 0 || screenId >= screens.length) {
          throw new Error(`Invalid screen ID: ${screenId}`);
        }
        const screen = screens[screenId];
        finalX = screen.x + x;
        finalY = screen.y + y;
      }

      robot.moveMouse(finalX, finalY);

      if (doubleClick) {
        if (button === "left") {
          robot.mouseClick("left", true);
        } else if (button === "right") {
          robot.mouseClick("right", true);
        } else {
          robot.mouseClick("middle", true);
        }
      } else {
        if (button === "left") {
          robot.mouseClick();
        } else if (button === "right") {
          robot.mouseClick("right");
        } else {
          robot.mouseClick("middle");
        }
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              clicked: { x: finalX, y: finalY },
              button,
              doubleClick,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to click mouse: ${error}`);
    }
  }

  private async scrollMouse(
    x: number,
    y: number,
    direction: string,
    clicks: number = 3,
    screenId?: number
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      let finalX = x;
      let finalY = y;

      if (screenId !== undefined) {
        const screens = await screenshot.listDisplays();
        if (screenId < 0 || screenId >= screens.length) {
          throw new Error(`Invalid screen ID: ${screenId}`);
        }
        const screen = screens[screenId];
        finalX = screen.x + x;
        finalY = screen.y + y;
      }

      robot.moveMouse(finalX, finalY);

      const scrollAmount = clicks * 3; // robotjs uses pixels

      if (direction === "up") {
        robot.scrollMouse(0, scrollAmount);
      } else if (direction === "down") {
        robot.scrollMouse(0, -scrollAmount);
      } else if (direction === "left") {
        robot.scrollMouse(scrollAmount, 0);
      } else if (direction === "right") {
        robot.scrollMouse(-scrollAmount, 0);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              scrolled: { x: finalX, y: finalY },
              direction,
              clicks,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to scroll mouse: ${error}`);
    }
  }

  private async typeText(
    text: string,
    x?: number,
    y?: number,
    screenId?: number
  ): Promise<{ content: Array<{ type: string; text: string }> }> {
    try {
      if (x !== undefined && y !== undefined) {
        let finalX = x;
        let finalY = y;

        if (screenId !== undefined) {
          const screens = await screenshot.listDisplays();
          if (screenId < 0 || screenId >= screens.length) {
            throw new Error(`Invalid screen ID: ${screenId}`);
          }
          const screen = screens[screenId];
          finalX = screen.x + x;
          finalY = screen.y + y;
        }

        robot.moveMouse(finalX, finalY);
        robot.mouseClick();
        // Small delay to ensure focus
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      robot.typeString(text);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              text,
              typed: true,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to type text: ${error}`);
    }
  }

  private async pressKey(key: string): Promise<{
    content: Array<{ type: string; text: string }>;
  }> {
    try {
      // Parse key combinations like "cmd+c", "ctrl+shift+t"
      const parts = key.toLowerCase().split("+");
      const modifiers: string[] = [];
      let mainKey = "";

      for (const part of parts) {
        const trimmed = part.trim();
        if (
          trimmed === "cmd" ||
          trimmed === "meta" ||
          trimmed === "ctrl" ||
          trimmed === "control" ||
          trimmed === "alt" ||
          trimmed === "shift"
        ) {
          modifiers.push(trimmed);
        } else {
          mainKey = trimmed;
        }
      }

      if (!mainKey) {
        throw new Error("No main key specified");
      }

      // Map common key names
      const keyMap: { [key: string]: string } = {
        enter: "enter",
        return: "enter",
        tab: "tab",
        space: "space",
        backspace: "backspace",
        delete: "delete",
        esc: "escape",
        escape: "escape",
        up: "up",
        down: "down",
        left: "left",
        right: "right",
        home: "home",
        end: "end",
        pageup: "pageup",
        pagedown: "pagedown",
      };

      const mappedKey = keyMap[mainKey] || mainKey;

      if (modifiers.length > 0) {
        // Handle modifiers
        const modifierKeys: string[] = [];
        for (const mod of modifiers) {
          if (mod === "cmd" || mod === "meta") {
            modifierKeys.push("command");
          } else if (mod === "ctrl" || mod === "control") {
            modifierKeys.push("control");
          } else if (mod === "alt") {
            modifierKeys.push("alt");
          } else if (mod === "shift") {
            modifierKeys.push("shift");
          }
        }

        robot.keyTap(mappedKey, modifierKeys);
      } else {
        robot.keyTap(mappedKey);
      }

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              success: true,
              key,
              pressed: true,
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to press key: ${error}`);
    }
  }

  private async getMousePosition(): Promise<{
    content: Array<{ type: string; text: string }>;
  }> {
    try {
      const pos = robot.getMousePos();
      const screenSize = robot.getScreenSize();

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              x: pos.x,
              y: pos.y,
              screenSize: {
                width: screenSize.width,
                height: screenSize.height,
              },
            }),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get mouse position: ${error}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Screen Control MCP server running on stdio");
  }
}

const server = new ScreenControlServer();
server.run().catch(console.error);

