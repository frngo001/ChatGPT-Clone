### Konfiguration von Parametern in ICUFiles

Um Parameter in ICUFiles einzustellen, müssen Sie über das Admin Portal die Dialogfenster konfigurieren. Hier sind die detaillierten Schritte:

#### Auswahl der Station und Kategorie
Navigieren Sie im Admin Portal zu **Intensivmedizin → Dialogfenster** [CITATION:61]. Wählen Sie zunächst die gewünschte Station aus, für die Sie die Konfiguration vornehmen möchten [CITATION:61]. Jede Station besitzt eine eigene Konfiguration der Krankenakte [CITATION:61]. Anschließend wählen Sie aus der Kategorienliste die entsprechende Kategorie aus, in der Sie arbeiten möchten [CITATION:63].

#### Erstellen eines neuen Dialogfensters
Um ein neues Dialogfenster zu erstellen, wählen Sie die gewünschte Kategorie aus und klicken auf den kleinen Pfeil neben der Kategorienliste [CITATION:63]. Geben Sie im Textfeld "Name" die Bezeichnung des neuen Dialogfensters ein und klicken Sie auf "Hinzufügen" [CITATION:63]. Das Dialogfenster wird in die Übersicht eingetragen [CITATION:63]. **Hinweis**: Dialogfenster ohne Parameter können nicht gespeichert werden [CITATION:63].

#### Erstellen eines neuen Parameters
Für ein Dialogfenster können Sie neue Parameter erstellen, indem Sie im Textfeld "Parameter" einen Namen vergeben und den Daten-Typ auswählen [CITATION:65]. Folgende Daten-Typen stehen zur Verfügung:
- **Freitext**: Für Texteingaben [CITATION:66]
- **Festtext**: Für vordefinierte Textauswahl [CITATION:66]
- **Textbaum**: Für Einfach- oder Mehrfachauswahl [CITATION:66]
- **Zahlen**: Für numerische Werte [CITATION:77]
- **Ja - Nein**: Für binäre Entscheidungen [CITATION:77]
- **Score**: Für Bewertungssysteme [CITATION:77]
- **Bilanz**: Für Bilanzierungszwecke [CITATION:77]
- **Summe**: Für Summenberechnungen [CITATION:77]
- **Kurve**: Für grafische Darstellungen [CITATION:77]

Nach der Eingabe bestätigen Sie mit "Hinzufügen" [CITATION:65]. Für Zahlenparameter können Sie optional eine Einheit (z.B. cm, kg) im Feld "Einheit" eingeben [CITATION:65].

#### Konfiguration der Textvorlagen
Für Parameter mit den Daten-Typen Freitext, Festtext oder Textbaum können Textvorlagen erstellt werden [CITATION:66]. Führen Sie einen Rechtsklick in der Spalte "Wert [Einheit]" des gewünschten Parameters aus und wählen Sie den entsprechenden Kontextmenüeintrag [CITATION:66]:

- **Freitextvorlagen**: Für frei eingebbaren Text mit Synonymen und Tooltips [CITATION:67]
- **Festtextvorlagen**: Mit Logikverknüpfungen und Gewichtungen [CITATION:69]
- **Textbaumvorlagen**: Mit hierarchischer Struktur und Ebenenmodus [CITATION:72]

#### Weitere Parameter-Einstellungen
Über das Kontextmenü des Parameternamens können zusätzliche Einstellungen vorgenommen werden [CITATION:78]:

- **Oberbegriff, Text, Textlänge**: Bestimmung der Darstellung in ICUFiles [CITATION:79]
- **Grenzwerte**: Festlegung von Minimal-/Maximalwerten sowie Warn- und Alarmgrenzen [CITATION:80]
- **Eingabepflicht**: Markierung als Pflichtfeld [CITATION:81]
- **Anzeigewert-Farbe**: Anpassung von Hintergrund- und Schriftfarbe [CITATION:82]

#### Speichern und Exportieren
Nach Abschluss der Konfiguration müssen die Änderungen gespeichert werden. Klicken Sie auf "Vorlagen exp." um Text- und Kommentarvorlagen für ICUFiles zu exportieren [CITATION:62]. **Wichtig**: Die neuen Einstellungen stehen erst nach einem Neustart von ICUFiles zur Verfügung [CITATION:62].

### Citations
[1] MANUAL: Administratorhandbuch Rev.000 (caj) | SECTION: 4.1 Dialogfenster | TOPIC: Intensivmedizin Konfiguration | CONTENT: In ICUFiles werden Patientendaten über Dialogfenster in die Patientenakte eingetragen. Über das Admin Portal können die gewünschten Konfigurationen an bereits bestehenden Dialogfenstern vorgenommen und neue Dialogfenster erstellt werden. Navigieren Sie im Anzeigebaum auf den Menüpunkt Intensivmedizin → Dialogfenster. Hier öffnet sich zunächst eine Liste mit den bearbeitbaren Stationen. Wählen Sie hier die gewünschte Station mithilfe eines Doppelklicks oder durch markieren der Station und einem Klick auf die Schaltfläche Ok aus.
[2] MANUAL: Administratorhandbuch Rev.000 (caj) | SECTION: 4.1.2 Erstellen eines neuen Dialogfensters | TOPIC: Dialogfenster Erstellung | CONTENT: Um ein neues Dialogfenster zu Erstellen, wählen Sie aus der Kategorienliste die gewünschte Kategorie aus. Anschließend klicken Sie auf den kleinen Pfeil und eine Eingabemaske öffnet sich. Tragen Sie in das Textfeld Name die Bezeichnung des neuen Dialogfensters ein, mithilfe der Schaltfläche Hinzufügen wird das Dialogfenster in die nebenstehende Übersicht eingetragen. Anschließend können Parameter für das Dialogfenster erstellt werden. Dialogfenster ohne Parameter können nicht gespeichert werden.
[3] MANUAL: Administratorhandbuch Rev.000 (caj) | SECTION: 4.1.3 Konfiguration der Textvorlagen | TOPIC: Parameter Vorlagen | CONTENT: Um einen Parameter zu bearbeiten und ihm, entsprechend seines Daten-Typs, Textvorlagen zu zuweisen, führen Sie einen Rechtsklick in der Spalte Wert [Einheit] des gewünschten Parameters aus. Über das Kontextmenü kann die Bearbeitung der Textvorlagen gestartet werden. Vorlagen können dabei nur für die folgenden Daten-Typen hinterlegt werden: Freitext, Festtext, Textbaum (Einfach- und Mehrfachauswahl).
[4] MANUAL: Administratorhandbuch Rev.000 (caj) | SECTION: 4.1.5 Konfiguration des Akteneintrages in ICUFiles | TOPIC: Parameter Darstellung | CONTENT: Durch einen Rechtsklick auf einen Parameternamen öffnet sich ein Kontextmenü mit dessen Hilfe die grafische Darstellung des Parameters in ICUFiles bearbeitet werden kann. Über einen Klick auf den Kontextmenüeintrag Oberbegriff, Text, Textlänge… öffnet sich ein weiteres Fenster. In diesem Fenster kann die Darstellung des jeweiligen Parametertextes in ICUFiles bearbeitet werden.

### Suggested Questions
* Welche verschiedenen Daten-Typen stehen für Parameter zur Verfügung und wann werden sie verwendet?
* Wie können Logiken und Gewichtungen für Festtextparameter konfiguriert werden?
* Welche Einstellungsmöglichkeiten gibt es für die grafische Darstellung von Parametern in ICUFiles?
* Wie werden Grenzwerte für Zahlenparameter definiert und welche Auswirkungen haben sie?