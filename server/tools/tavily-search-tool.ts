import { TavilySearchResults } from "@langchain/community/tools/tavily_search";
import { Tool } from "@langchain/core/tools";

/**
 * Tavily Search Tool für LangChain Integration
 * 
 * @description
 * Wrapper um das Tavily Search Tool von LangChain für Websuche.
 * Ermöglicht strukturierte Suchergebnisse mit Titel, URL und Inhalt.
 */
export async function createTavilySearchTool(): Promise<Tool> {
  const tavilyApiKey = process.env.TAVILY_API_KEY;
  
  if (!tavilyApiKey) {
    throw new Error(
      "TAVILY_API_KEY ist nicht gesetzt. Bitte setze die Umgebungsvariable TAVILY_API_KEY."
    );
  }

  // Erstelle Tavily Search Tool mit max 10 Ergebnissen
  const tavilyTool = new TavilySearchResults({
    apiKey: tavilyApiKey,
    maxResults: 30,
  });

  return tavilyTool;
}

/**
 * Führt eine Websuche mit Tavily durch
 * 
 * @param query - Suchanfrage
 * @returns Promise mit Suchergebnissen: Array von { title, url, content }
 */
export async function performTavilySearch(
  query: string
): Promise<Array<{ title: string; url: string; content: string }>> {
  try {
    const tavilyTool = await createTavilySearchTool();
    const result = await tavilyTool.invoke(query);
    
    // TavilySearchResults.invoke() gibt einen String zurück (JSON-encoded)
    // Oder direkt ein Array je nach LangChain Version
    let parsedResults: any[];
    
    if (typeof result === 'string') {
      try {
        // Versuche JSON zu parsen
        parsedResults = JSON.parse(result);
      } catch {
        // Falls kein JSON, versuche als Array zu behandeln
        parsedResults = [];
      }
    } else if (Array.isArray(result)) {
      parsedResults = result;
    } else {
      // Fallback: Versuche aus Objekt zu extrahieren
      parsedResults = result?.results || result?.content || [];
    }
    
    // Konvertiere zu unserem Format
    if (Array.isArray(parsedResults)) {
      return parsedResults.map((item: any) => {
        // Unterstütze verschiedene mögliche Formate
        const title = item.title || item.name || item.url?.split('/').pop() || "Unbekannter Titel";
        const url = item.url || item.link || "";
        const content = item.content || item.snippet || item.description || "";
        
        return { title, url, content };
      }).filter((item) => item.url); // Nur Ergebnisse mit URL
    }
    
    return [];
  } catch (error) {
    console.error("Tavily Search Error:", error);
    throw error;
  }
}

