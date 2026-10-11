# Anleitung – Floorplan Studio

Diese Anleitung zeigt Schritt für Schritt, was der Planer kann und wie du ihn benutzt.

## 1. Erste Schritte
1. Installation über HACS (siehe [README](../README.md)), Home Assistant neu starten, Integration „Floorplan Studio“ hinzufügen.
2. In der Seitenleiste auf **Grundriss** klicken – der Editor öffnet sich.
3. Oben wechselst du zwischen **Bearbeiten** und **Live** (Bedienen). Gespeichert wird automatisch in Home Assistant.

## 2. Zeichnen
| Werkzeug | Taste | Bedienung |
|---|---|---|
| Auswählen | V | Objekte, Wände, Räume anklicken, ziehen, skalieren (Griffe), drehen |
| Wand | W | Klick = Punkt setzen, **Enter** oder Doppelklick = beenden, **Umschalt** = gerade Linie |
| Raum | R | Rechteck aufziehen; Name, Boden und Farbe in den Eigenschaften |
| Polygon | P | Beliebige Raumform, Enter/Doppelklick schließt |
| Hand | H | Plan verschieben (alternativ Mittelmaustaste / Zwei-Finger-Geste) |

* **Alt** gedrückt halten schaltet das Einrasten aus.
* **Wandhöhe je Wand:** in den Wand-Eigenschaften (0 = Standardhöhe) – für Brüstungen, Giebel, Mauern.
* **Etagen:** über die Etagen-Tabs beliebig viele Stockwerke anlegen.
* **Garten:** Rasen, Wege, Terrasse, Zaun, Bäume, Pool u. v. m. aus der Kategorie Garten.
* **DXF-Import** und **Plan prüfen** findest du im Menü (⋯).

## 3. Objekte platzieren
* Links in der **Bibliothek** (260+ Objekte, Suche und Kategorien): anklicken und im Plan platzieren oder per Drag & Drop hineinziehen.
* **Türen und Fenster** rasten an Wänden ein, Tore und Bereiche gibt es ebenfalls.
* Griffe am Objekt: Größe ändern und drehen. Eigenschaften (Name, Farbe, Größe, Beschriftung) rechts im Inspektor.
* **Eigene Symbole** lassen sich hochladen.
* **Feinschliff:** Pfeiltasten = 1 cm, Umschalt+Pfeil = 10 cm, Strg/Alt+Pfeil = 0,5 cm.
* **Sperren:** Knopf **🔒 Sperren** oben sperrt alle Wände, Räume und den Hintergrundplan; einzelne Elemente sperrst du per Häkchen „Sperren“ im Inspektor. Gesperrtes lässt sich nicht verschieben, skalieren oder löschen.
* **Mehrfachauswahl:** Umschalt+Klick – gemeinsam verschieben, drehen, löschen.
* **Montage & Höhe:** je Objekt Boden / Wand / Decke und Höhe über Boden (z. B. Wandleuchter auf 180 cm).
* **Deckenansicht:** Knopf „Decke“ oben – nur Deckenobjekte (Spots, Lampen) sind bearbeitbar, der Rest blass.

### Treppen und mehrere Etagen
1. Neue Etage über „+“ anlegen und darüber/darunter die Wände zeichnen.
2. In der unteren Etage eine **Treppe** aus der Bibliothek (Bau & Deko) platzieren.
3. In der Etage darüber erscheint die gestrichelte **Treppenöffnung**; in 3D ist der Boden dort ausgeschnitten und die Treppe führt hindurch.
4. In 3D auf **🚶 Begehen** klicken und die Treppe hochlaufen.

## 4. Mit Home Assistant verknüpfen
* Objekt wählen → **Auswählen …**: Suche mit Filter nach Typ und Bereich.
* Tab **Entitäten**: Zeile auf den Plan ziehen oder mehrere ankreuzen und platzieren – Typ, Beschriftung und Wertanzeige werden automatisch gesetzt.
* **Mehrere Entitäten je Objekt:** Hauptentität (z. B. Smart-Steckdose des Fernsehers) plus „Weitere Entitäten“ (Fernbedienung, Status, Messwerte). Das **Geräte-Popup** (langer Druck) zeigt alle mit Bedienelementen.
* **Tippen-Aktion** je Objekt: Schalten, Details, Geräte-Popup, Szene …
* **Alarme, Anwesenheit, Szenen, Heatmap, Verlauf und Kamera-Popup** werden über die jeweiligen Entitäten gesteuert (siehe README „Live-Übersicht“).

## 5. Live-Modus
* Tippen schaltet (Lampen, Schalter, Szenen …), **langer Druck** öffnet die Details.
* Lampen leuchten, Heizungen und Sensoren zeigen ihre Werte.
* Zusätzlich: Kiosk-Modus, Rundgang, Stückliste/Druck/PDF, mehrere Gebäude, VR/AR.

## 5b. Experten-Modus (2D)

Der Schalter **„Experte“** in der Kopfzeile blendet professionelle Planungswerkzeuge ein; ohne ihn bleibt die Oberfläche schlicht. Die Einstellung wird im Plan gespeichert.

- **Messen (M):** zwei Punkte anklicken – Abstand und Winkel (Umschalt = gerade).
- **Bemaßung (D):** Start, Ende, dann Maßlinie platzieren; bleibt im Plan, erscheint in SVG/DXF/Druck. Wände und Räume lassen sich per Knopf im Inspektor bemaßen.
- **Hilfslinien (G):** Klick = waagerecht, Umschalt = senkrecht; Punkte rasten daran ein. Verschieben/Löschen mit dem Auswahl-Werkzeug.
- **Ausrichten, Verteilen, Spiegeln:** mehrere Elemente mit Umschalt+Klick markieren, dann die Knöpfe im Inspektor.
- **Wandwerkzeuge:** Parallele Wand, Wand teilen; **„Alle gleichen Typs markieren“** für Objekte.
- **Suchen (Strg+F):** Objekte, Räume, Stromkreise, Entitäten.
- **Funk-Reichweite und Sichtfeld:** je Objekt einstellbar; Wände schwächen das Funksignal bzw. verdecken das Sichtfeld.
- **Leitungen (K):** zwischen zwei Geräten, mit Zwischenpunkten; Längen inkl. Zuschlag je Ende (Einstellung „Leitungszuschlag“), Summen je Art in der Stückliste.
- **Stromkreise / Sicherungen:** Objekte bekommen eine Bezeichnung (z. B. F3); Legende im Inspektor hebt einen Kreis im Plan hervor.
- **Ausstattung prüfen:** meldet Räume ohne Rauchmelder, Steckdose oder Bewegungssensor.
- **Export:** Etage als SVG oder DXF (Layer WAENDE, RAEUME, OBJEKTE, MASSE, LEITUNGEN, TEXT; mm). Im Druck erscheint ein Schriftfeld mit Planer, Plan-Nr., Datum und Maßstab.

## 5d. Vorlagen (Räume, Garagen, Etagen)
Knopf **„Vorlagen“** über der Objektbibliothek (oder Menü ⋯): vorkonfigurierte **Räume** (Wohnzimmer, Küche, Schlafzimmer, Kinderzimmer, Bad, Gäste-WC, Büro, Flur, Hauswirtschaftsraum), **Gebäude** (Einzel-/Doppelgarage, Garage mit Werkstatt, Carport, Doppelcarport, Gartenhaus – mit Wänden, Tor, Tür, Fenster und Dach) und **komplette Etagen** (Erdgeschoss, Obergeschoss, Keller eines Einfamilienhauses). Räume und Gebäude landen in der Mitte der Ansicht und sind danach markiert (verschieben, drehen, sperren); Etagen werden als neue Etage angelegt.

## 5c. Dächer
Kategorie **Dach** in der Objektbibliothek: Satteldach, Walmdach, Pultdach, Flachdach, Zeltdach, Vordach. Beim Einfügen passt sich das Dach an die Außenwände der Etage an. Im Inspektor: Dachform, Neigung, Überstand, Firstrichtung, Eindeckung, Farbe und Höhe über der Wandoberkante. Mehrere Dächer lassen sich kombinieren (Anbau, Garage, Vordach); ein Dach auf der obersten Etage ersetzt das automatische Haus-Dach. In 2D erscheint es als gestrichelte Fläche mit Firstlinie, in 3D als echtes Dach.

## 6. 3D-Ansicht
* Umschalten über **3D** oben. Drehen (ziehen), Zoomen (Rad/Pinch), Verschieben (rechte Maustaste / zwei Finger).
* **Realistisch-Modus:** physikalisch korrektes Licht, Spiegelungen, Schatten. Nur hier erscheinen die detaillierten Fahrzeuge und eigene 3D-Modelle (ohne Realistisch-Modus zeigen Fahrzeuge ein vereinfachtes 3D-Modell).
* **Rundgang** (Walk-Modus) zum Durchlaufen des Hauses.

### Bearbeiten in 3D
* Werkzeuge **Wand / Raum / Rechteck** funktionieren auch in der 3D-Ansicht: auf den Boden klicken.
* **Auswahl:** Wand oder Raum antippen → Griffe: Enden/Ecken ziehen, orangener Mittelgriff verschiebt das ganze Element. Objekte lassen sich wie bisher verschieben (erst auswählen, dann ziehen).

**Iso-Ansicht (2,5D):** In der Dashboard-Karte zeigt der Knopf „Iso“ neben „3D“ eine isometrische Ansicht ohne WebGL (läuft auch auf schwachen Tablets). Wände vorne sind niedrig, Objekte erscheinen als Quader mit ihrem Live-Symbol; Tippen schaltet wie in 2D, „↻ Drehen“ dreht in 90°-Schritten. Direkt starten: `view: iso`.

## 7. Fahrzeuge und eigene 3D-Modelle
* Kategorie **Fahrzeuge**: Tesla, BMW, Audi, Mercedes, VW, Porsche, Hyundai, Kia, Polestar u. a. Farbe frei wählbar.
* Entität (Ladestatus) verknüpfen: Ladestreifen leuchtet; mit Tracker wird das Auto ausgeblendet, wenn es nicht zuhause ist.
* **Eigenes 3D-Modell:** Objekt wählen → „Eigenes 3D-Modell“ → `.glb`, `.gltf` (eingebettet) oder `.obj` hochladen (bis 60 MB; Draco wird nicht unterstützt). Ausrichtung und Größe lassen sich nachjustieren. Lizenz des Modells beachten.

## 8. Energiefluss
1. Pro Verbraucher unter „Home Assistant“ einen Leistungs-Sensor setzen (*Energiefluss: Leistung dieses Geräts*).
2. Energie-Sensoren (PV, Netz, Batterie) in den Plan-Einstellungen bzw. Kartenoptionen eintragen.
3. In Karte/Editor ⚡ **Energiefluss** einschalten: Das Haus wird zur transparenten Schnittansicht, nur die Flüsse bleiben sichtbar.

Aussehen per Kartenoptionen (`energy_flow_style`, `energy_flow_speed`, `energy_flow_width`, `energy_flow_min`) oder CSS:
```css
.stage3 {
  --fp-flow-style: arrows;   /* dots | dashes | arrows | line | glow */
  --fp-flow-speed: 1.5;
  --fp-flow-width: 1.2;
  --fp-flow-pv: #ffc107; --fp-flow-grid: #ef5350; --fp-flow-export: #66bb6a;
  --fp-flow-bat: #26c6da; --fp-flow-load: #42a5f5; --fp-flow-ghost: 0.1;
}
```

## 9. Dashboard-Karte
Menü (⋯) → *Dashboard in Home Assistant …* legt ein fertiges Dashboard an. Oder in jedes Dashboard:
```yaml
type: custom:floorplan-studio-card
# floor: Erdgeschoss
# title: Mein Haus
# gestures: false
# rotate_gesture: true   # 2D-Ansicht per Geste drehbar (Standard: aus, nur Zoomen/Verschieben)
# rotate: 90
# energy_flow: true
```
Die meisten Optionen lassen sich im Karten-Editor von Home Assistant per Klick einstellen (in allen Sprachen).

## 10. Tastenkürzel
| Taste | Funktion |
|---|---|
| V / W / R / P / H | Werkzeuge |
| Enter | Zeichnung beenden |
| Umschalt | gerade Linie / Mehrfachauswahl |
| Alt | Einrasten aus |
| Pfeile | 1 cm (Umschalt 10 cm, Strg/Alt 0,5 cm) |
| Strg+Z / Strg+Y | Rückgängig / Wiederholen |
| Strg+C / V / D | Kopieren / Einfügen / Duplizieren |
| Entf | Löschen |

## 11. Sicherung und Datenschutz
Der Plan liegt in `.storage/floorplan_studio.plan` (Teil deiner HA-Backups). Zusätzlich gibt es automatische Sicherungen im Menü (*Sicherungen …*). Es werden keine Daten nach außen gesendet.

## 12. Fehlersuche
* **Panel fehlt:** Home Assistant neu starten, Browser-Cache leeren (Strg+F5).
* **Karte nicht gefunden:** Ressource `/floorplan_studio/floorplan-card.js` prüfen, Seite neu laden.
* **Eigenes Modell unsichtbar:** in den Realistisch-Modus wechseln.
* **Eigenes Modell schwarz/fehlt:** GLB statt GLTF verwenden, keine Draco-Kompression, Datei < 60 MB.
* **Energiefluss leer:** Leistungs-Sensoren prüfen (Einheit W/kW) und `energy_flow_min` senken.
