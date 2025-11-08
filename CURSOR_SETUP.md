# Konfigurera Screen Control MCP i Cursor

## Steg 1: Hitta din Cursor MCP-konfigurationsfil

Cursor lagrar MCP-serverkonfigurationen i en JSON-fil. Lokaliseringen varierar beroende på operativsystem:

### macOS
```
~/Library/Application Support/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json
```

Eller:
```
~/.cursor/mcp.json
```

### Linux
```
~/.config/Cursor/User/globalStorage/rooveterinaryinc.roo-cline/settings/cline_mcp_settings.json
```

### Windows
```
%APPDATA%\Cursor\User\globalStorage\rooveterinaryinc.roo-cline\settings\cline_mcp_settings.json
```

## Steg 2: Lägg till servern i konfigurationen

Öppna konfigurationsfilen och lägg till följande (eller uppdatera om filen redan finns):

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

**Viktigt**: Ersätt `/Users/peteraspenberg/screen-control-mcp/dist/index.js` med den absoluta sökvägen till din installation.

För att hitta den absoluta sökvägen:
```bash
cd ~/screen-control-mcp
pwd
# Lägg till /dist/index.js till slutet av sökvägen
```

## Steg 3: Starta om Cursor

Efter att ha lagt till konfigurationen, starta om Cursor för att ladda in den nya MCP-servern.

## Steg 4: Verifiera installationen

När Cursor har startat om, kan du testa servern genom att be AI:n att:
- Lista tillgängliga skärmar
- Ta en skärmdump
- Få muspekarepositionen

## Säkerhetsvarning

⚠️ **VIKTIGT**: Denna server ger full kontroll över din mus och tangentbord. Se till att:
- Du endast använder den med seriösa AI-assistenter
- Du är medveten om vad AI:n gör när den använder dessa verktyg
- Du har rätt behörigheter på macOS (System Preferences > Security & Privacy > Accessibility)

## macOS-behörigheter

För att robotjs ska fungera på macOS behöver du ge Terminal (eller Cursor) behörighet att kontrollera datorn:

1. Öppna **System Preferences** (Systeminställningar)
2. Gå till **Security & Privacy** (Säkerhet och integritet)
3. Välj fliken **Privacy** (Integritet)
4. Välj **Accessibility** (Hjälpmedel)
5. Lägg till Terminal eller Cursor om de inte redan finns
6. Se till att de är ikryssade

## Felsökning

### Servern startar inte
- Kontrollera att sökvägen till `dist/index.js` är korrekt
- Kontrollera att du har kört `npm install` och `npm run build`
- Kontrollera att Node.js är installerat och tillgängligt i PATH

### Mus/tangentbord fungerar inte
- Kontrollera macOS-behörigheter (se ovan)
- Försök köra servern manuellt för att se felmeddelanden:
  ```bash
  node ~/screen-control-mcp/dist/index.js
  ```

### Skärmdumpar fungerar inte
- Kontrollera att `screenshot-desktop` är korrekt installerat
- Testa manuellt med test-skriptet:
  ```bash
  node test-server.js
  ```

