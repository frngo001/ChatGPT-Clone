import { performTavilySearch } from "../tools/tavily-search-tool.js";

/**
 * LangChain Web Search Agent mit Tavily Integration
 * 
 * @description
 * Führt intelligente Websuchen mit Tavily durch und optimiert Queries
 * basierend auf Chat-Historie. Formatiert Ergebnisse im erwarteten Format.
 */

interface ChatHistoryMessage {
  role: string;
  content: string;
}

/**
 * Optimiert die Such-Query basierend auf Chat-Historie
 * 
 * @param query - Originale Suchanfrage
 * @param chatHistory - Optionale Chat-Historie für Kontext
 * @returns Optimierte Suchanfrage
 */
function optimizeQuery(
  query: string,
  chatHistory?: ChatHistoryMessage[]
): string {
  if (!chatHistory || chatHistory.length === 0) {
    return query;
  }

  // Extrahiere letzten Kontext (letzte 5 Nachrichten)
  const lastMessages = chatHistory.slice(-5);
  const contextParts: string[] = [];

  for (const msg of lastMessages) {
    const textContent = msg.content.substring(0, 150); // Kürze für bessere Query
    if (textContent.length > 0) {
      contextParts.push(textContent);
    }
  }

  if (contextParts.length > 0) {
    // Erstelle kontextbezogene Query
    const context = contextParts.join(" | ");
    return `${query} [Kontext: ${context}]`;
  }

  return query;
}

/**
 * Führt eine Websuche mit LangChain/Tavily durch
 * 
 * @param query - Suchanfrage
 * @param chatHistory - Optionale Chat-Historie für Kontext
 * @returns Promise mit Suchergebnissen im Format: { content, sources }
 */
export async function performLangChainWebSearch(
  query: string,
  chatHistory?: ChatHistoryMessage[]
): Promise<{ content: string; sources: Array<{ title: string; url: string }> }> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;

  if (!tavilyApiKey) {
    throw new Error(
      "TAVILY_API_KEY ist nicht gesetzt. Bitte setze die Umgebungsvariable TAVILY_API_KEY."
    );
  }

  // Optimiere Query mit Chat-Historie
  const optimizedQuery = optimizeQuery(query, chatHistory);

  // Führe Suche mit Tavily durch - Fehler werden weitergeworfen
  const results = await performTavilySearch(optimizedQuery);

  // Formatiere Ergebnisse im erwarteten Format
  let content = "";
  const sources: Array<{ title: string; url: string }> = [];

  if (results.length > 0) {
    content += "Aktuelle Informationen aus dem Web:\n\n";
    
    results.forEach((result, index) => {
      content += `${index + 1}. ${result.title}\n`;
      if (result.content) {
        content += `${result.content}\n`;
      }
      content += `Quelle: ${result.url}\n\n`;

      sources.push({
        title: result.title || "Unbekannter Titel",
        url: result.url,
      });
    });
  } else {
    content = "Keine Suchergebnisse gefunden.";
  }

  return { content, sources: sources.slice(0, 10) }; // Limit auf 10 Quellen
}

