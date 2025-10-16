### Installation der Regeldateien

Die Installation der Regeldateien für das DRG-Management erfolgt durch das Platzieren der Dateien in bestimmten Verzeichnissen, von wo aus sie automatisch an die Clients verteilt werden [CITATION:1].

#### Grouper- und Regelprüferfunktion
Für die integrierte Grouper- und Regelprüferfunktionalität werden verschiedene Dateien benötigt, darunter `3MAll-In-One.jar`, Lizenzdateien wie `3MGDRGGrouper.liz` und `3MRuleChecker.liz`, sowie Regelpakete für verschiedene Jahre (`Rules2003.rpk` bis `Rules2013.rpk`) [CITATION:2]. Diese Dateien müssen einmalig im zentralen Verzeichnis `$Narko4ad$\KisData\lib` abgelegt werden [CITATION:2]. Die KISData-Clientsoftware kopiert diese Dateien anschließend automatisch in das lokale `lib`-Verzeichnis des jeweiligen Rechners [CITATION:2].

#### Zusatzentgeltdateien
Für die Darstellung der Zusatzentgelte im Fachrichtungsabschluss werden die entsprechenden Regeldateien benötigt, beispielsweise `DRG-G-DRG 2014 Hauptabteilung.txt` und die Zusatzentgeltdateien `ZE2014_1.txt`, `ZE2014_2.txt`, `ZE2014_3.txt` [CITATION:3]. Diese Dateien müssen im zentralen Katalogverzeichnis `$Narko4ad$\KisData\KisDataVorlagen\DRGKataloge\2014` platziert werden [CITATION:3]. Auch hier übernimmt die KISData-Clientsoftware die automatische Verteilung in das lokale `lib`-Verzeichnis der Client-Rechner [CITATION:3].

#### Bezugsquelle
Die aktuellen Dateien für beide Bereiche können aus dem Kundenbereich des IMESO-Web-Portals bezogen werden [CITATION:2][CITATION:3]. Für die Bibliotheksdateien steht unter `Download → KISData → lib` eine Archivdatei (z.B. `lib.1591.zip`) zur Verfügung [CITATION:2]. Die aktuellen Katalogdateien für ein bestimmtes Jahr (z.B. 2014) finden sich unter `Download → KISData → schluessel → aktuelles Jahr` in einer Archivdatei (z.B. `DRGKataloge.DE.GI.2014.zip`) [CITATION:3].

### Citations
[1] MANUAL: Administratorhandbuch Rev.004 (hec) | SECTION: 2 Einrichtung des DRG-Arbeitsplatzes | TOPIC: Konfiguration | CONTENT: Aufgrund der breiten Funktionalität existiert ein Konfigurationsbedarf auf verschiedenen Ebenen, der sich teilweise mit anderen KISData-Funktion überschneidet. Der DRG-Arbeitsplatz ist ein Teil des Subsystems DRG-Management und ist damit integraler Bestandteil von ICUData.
[2] MANUAL: Administratorhandbuch Rev.004 (hec) | SECTION: 2.3 Grouper- und Regelprüferfunktion | TOPIC: Dateiinstallation | CONTENT: Diese Dateien werden einmal im zentralen $Narko4ad$\KisData\lib Verzeichnis deponiert. Die KisData-Clientsoftware kopiert diese automatisch in das lokale lib Verzeichnis des Rechners. Im Kundenbereich des IMESO-Web-Portals existiert unter Download → KISData → lib eine Archivdatei lib.1591.zip die alle aktuell von KISData benötigten Bibliotheksdateien enthält.
[3] MANUAL: Administratorhandbuch Rev.004 (hec) | SECTION: 2.4 Darstellung der Zusatzentgelte | TOPIC: Zusatzentgeltdateien | CONTENT: Für die Darstellung der Zusatzentgelte im Fachrichtungsabschluss werden die entsprechenden Regeldateien im zentralen Katalogverzeichnis $Narko4ad$\KisData\KisDataVorlagen\DRGKataloge\2014 benötigt. Die KISData-Clientsoftware kopiert diese automatisch in das lokale lib Verzeichnis des Rechners. Im Kundenbereich des IMESO-Web-Portals existiert unter Download → KISData → schluessel → aktuelles Jahr eine Archivdatei, z.B. DRGKataloge.DE.GI.2014.zip.

### Suggested Questions
* Wo genau finde ich die Archivdateien für die Regeldateien im IMESO-Web-Portal?
* Müssen die Regeldateien manuell auf jedem Client-Rechner installiert werden?
* Wie erfolgt die Aktualisierung der Regeldateien bei einem Jahreswechsel?