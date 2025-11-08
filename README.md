# Screen Control MCP Server

En MCP-server som ger dig möjlighet att se alla skärmar i operativsystemet och styra mus och tangentbord, så att du kan klicka var som helst på skärmen och skriva text.

## Funktioner

- 📺 **Skärmvisning**: Ta skärmdumpar av alla skärmar eller specifika skärmar
- 🖱️ **Mus-kontroll**: Flytta muspekaren, klicka, dubbelklicka, scrolla
- ⌨️ **Tangentbords-kontroll**: Skriv text, tryck tangenter och tangentkombinationer
- 🖥️ **Multi-skärm**: Stöd för flera skärmar/displays

## Installation

### Förutsättningar

- Node.js 18 eller senare
- npm eller yarn
- macOS, Linux eller Windows

### Steg

1. Klona repot:
```bash
git clone https://github.com/peteraspenberg/screen-control-mcp.git
cd screen-control-mcp
```

2. Installera dependencies:
```bash
npm install
```

**Viktigt för macOS**: `robotjs` kräver native compilation. Om du får fel vid installation:

```bash
# Installera Xcode Command Line Tools om de saknas
xcode-select --install

# Försök installera igen
npm install
```

3. Bygg projektet:
```bash
npm run build
```

## Konfiguration i Cursor

Lägg till följande i din Cursor MCP-konfiguration (t.ex. `~/.cursor/mcp.json` eller motsvarande):

```json
{
  "mcpServers": {
    "screen-control": {
      "command": "node",
      "args": ["/absolut/sökväg/till/screen-control-mcp/dist/index.js"]
    }
  }
}
```

Eller om du vill köra från projektmappen:

```json
{
  "mcpServers": {
    "screen-control": {
      "command": "node",
      "args": ["/Users/peteraspenberg/screen-control-mcp/dist/index.js"]
    }
  }
}
```

## Tillgängliga Tools

### `list_screens`
Lista alla tillgängliga skärmar/displays på systemet.

### `capture_screen`
Ta en skärmdump av en specifik skärm eller alla skärmar. Returnerar bilden som base64 data URI.

**Parametrar:**
- `screenId` (optional): Skärm-ID att fånga (0-indexed). Om inte angiven, fångas alla skärmar.
- `format` (optional): Bildformat ("png" eller "jpg", standard: "png")

### `get_screen_info`
Få information om alla skärmar (upplösning, position, etc.)

### `move_mouse`
Flytta muspekaren till angivna koordinater.

**Parametrar:**
- `x`: X-koordinat
- `y`: Y-koordinat
- `screenId` (optional): Skärm-ID (0-indexed)

### `click_mouse`
Klicka med musen på angivna koordinater.

**Parametrar:**
- `x`: X-koordinat
- `y`: Y-koordinat
- `button` (optional): Musknapp ("left", "right", "middle", standard: "left")
- `doubleClick` (optional): Utför dubbelklick (standard: false)
- `screenId` (optional): Skärm-ID (0-indexed)

### `scroll_mouse`
Scrolla mushjulet.

**Parametrar:**
- `x`: X-koordinat
- `y`: Y-koordinat
- `direction`: Scrollriktning ("up", "down", "left", "right")
- `clicks` (optional): Antal scroll-klick (standard: 3)
- `screenId` (optional): Skärm-ID (0-indexed)

### `type_text`
Skriv text på aktuell markörposition eller angivna koordinater.

**Parametrar:**
- `text`: Text att skriva
- `x` (optional): X-koordinat att klicka på innan skrivning
- `y` (optional): Y-koordinat att klicka på innan skrivning
- `screenId` (optional): Skärm-ID (0-indexed)

### `press_key`
Tryck en tangent eller tangentkombination.

**Parametrar:**
- `key`: Tangent att trycka (t.ex. "enter", "tab", "space", "cmd+c", "ctrl+shift+t")

### `get_mouse_position`
Få aktuell muspekareposition.

## Exempel

### Ta en skärmdump
```json
{
  "tool": "capture_screen",
  "arguments": {
    "screenId": 0,
    "format": "png"
  }
}
```

### Klicka på skärmen
```json
{
  "tool": "click_mouse",
  "arguments": {
    "x": 100,
    "y": 200,
    "button": "left"
  }
}
```

### Skriv text
```json
{
  "tool": "type_text",
  "arguments": {
    "text": "Hej världen!",
    "x": 500,
    "y": 300
  }
}
```

### Tryck tangentkombination
```json
{
  "tool": "press_key",
  "arguments": {
    "key": "cmd+c"
  }
}
```

## Säkerhet

⚠️ **VIKTIGT**: Denna server ger full kontroll över din mus och tangentbord. Använd endast med seriösa AI-assistenter som du litar på. Se alltid till att:

- Endast köra från källor du litar på
- Inte exponera servern för obehöriga
- Vara medveten om vad AI:n gör när den använder dessa verktyg

## Utveckling

```bash
# Bygg projektet
npm run build

# Bygg i watch-läge
npm run dev

# Starta servern direkt (för testning)
npm start
```

## Licens

MIT

## Bidrag

Bidrag är välkomna! Öppna gärna en issue eller pull request.

