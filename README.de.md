# Manager 2.0 GUI

[English](README.md) | [Polski](README.pl.md) | **Deutsch**

**Entwicklungsversion 2026.4 - 10. September 2026**

Manager 2.0 GUI ist ein React/TypeScript-Frontend für das Logistik-Backend
Manager 2.0. Es bietet Ansichten für Lager, Sendungen, Prozesse, Niederlassungen,
Kuriere, Benutzer und Konfiguration sowie einen separaten Super-Admin-Bereich.

![Dashboard der Niederlassung](docs/screenshots/de/light/dashboard.png)

## Über die Anwendung

Manager 2.0 ist eine Back-Office-Anwendung für Paket- und Logistikunternehmen.
Nach der Anmeldung sieht ein Mitarbeiter das Dashboard seiner Niederlassung:
Sendungszahlen, aktive Retouren, Umsatz, ein Volumendiagramm über 7/14/30 Tage
und eine Karte der verbundenen Niederlassungen. Über das obere Menü werden
Sendungen erfasst und verfolgt, Zustellungen und Retouren bearbeitet, Paletten
gebildet, Niederlassungen mit ihren Zustellgebieten und Lagerplänen verwaltet,
Abhol- und Paketstationen gepflegt, Backend-Prozesse geprüft und Nachrichten im
Organisationschat ausgetauscht. Jeder Bildschirm öffnet sich in einem eigenen
Tab, sodass mehrere Sendungen oder Niederlassungen parallel bearbeitet werden
können. Die Oberfläche ist kompakt und tabellenorientiert, mit Karten
(OpenStreetMap/Leaflet) überall dort, wo der Standort zählt. Sie steht auf
Polnisch, Englisch und Deutsch zur Verfügung und bringt mehrere Designs mit; die
Screenshots unten zeigen Hell, Graphit und Lager.

## Screenshots

Dieselben Ansichten in drei der verfügbaren Designs. Ein Klick auf ein Vorschaubild oder einen Designnamen öffnet das Bild in voller Größe.

<table>
  <tr>
    <th>Hell</th>
    <th>Graphit</th>
    <th>Lager</th>
  </tr>
  <tr>
    <td><a href="docs/screenshots/de/light/dashboard.png"><img src="docs/screenshots/de/light/dashboard.png" alt="Dashboard – Hell"></a></td>
    <td><a href="docs/screenshots/de/graphite/dashboard.png"><img src="docs/screenshots/de/graphite/dashboard.png" alt="Dashboard – Graphit"></a></td>
    <td><a href="docs/screenshots/de/warehouse/dashboard.png"><img src="docs/screenshots/de/warehouse/dashboard.png" alt="Dashboard – Lager"></a></td>
  </tr>
</table>

| Ansicht | Inhalt | Hell | Graphit | Lager |
| --- | --- | --- | --- | --- |
| Dashboard | Kennzahlen der Niederlassung, Umsatzdiagramm, Netzkarte | [Hell](docs/screenshots/de/light/dashboard.png) | [Graphit](docs/screenshots/de/graphite/dashboard.png) | [Lager](docs/screenshots/de/warehouse/dashboard.png) |
| Sendungen | Sendungsliste mit Status-Tabs, Filtern und Aktionen | [Hell](docs/screenshots/de/light/shipments.png) | [Graphit](docs/screenshots/de/graphite/shipments.png) | [Lager](docs/screenshots/de/warehouse/shipments.png) |
| Sendungsdetails | Daten, Zustellung, Verlauf, Kosten, QR-Etikett und Export | [Hell](docs/screenshots/de/light/shipment-details.png) | [Graphit](docs/screenshots/de/graphite/shipment-details.png) | [Lager](docs/screenshots/de/warehouse/shipment-details.png) |
| Zustellungen | Zustellregister mit Route, Zustand und Schritten | [Hell](docs/screenshots/de/light/deliveries.png) | [Graphit](docs/screenshots/de/graphite/deliveries.png) | [Lager](docs/screenshots/de/warehouse/deliveries.png) |
| Retouren | Retourensuche und Retourentabelle der Niederlassung | [Hell](docs/screenshots/de/light/returns.png) | [Graphit](docs/screenshots/de/graphite/returns.png) | [Lager](docs/screenshots/de/warehouse/returns.png) |
| Paletten | Paletten mit Frachtführer, Etiketten und Transportdokumenten | [Hell](docs/screenshots/de/light/pallets.png) | [Graphit](docs/screenshots/de/graphite/pallets.png) | [Lager](docs/screenshots/de/warehouse/pallets.png) |
| Niederlassungen | Karte der Zustellgebiete und Niederlassungsliste | [Hell](docs/screenshots/de/light/departments.png) | [Graphit](docs/screenshots/de/graphite/departments.png) | [Lager](docs/screenshots/de/warehouse/departments.png) |
| Niederlassungsplan | Lagerplan mit Palettenstellplätzen | [Hell](docs/screenshots/de/light/department-map.png) | [Graphit](docs/screenshots/de/graphite/department-map.png) | [Lager](docs/screenshots/de/warehouse/department-map.png) |
| Zustellgebiet | Zeichnen des Gebiets einer Niederlassung | [Hell](docs/screenshots/de/light/delivery-area.png) | [Graphit](docs/screenshots/de/graphite/delivery-area.png) | [Lager](docs/screenshots/de/warehouse/delivery-area.png) |
| Abholstationen | Katalog der Abhol- und Paketstationen auf der Karte | [Hell](docs/screenshots/de/light/pickup-points.png) | [Graphit](docs/screenshots/de/graphite/pickup-points.png) | [Lager](docs/screenshots/de/warehouse/pickup-points.png) |
| Prozesse | Prozessprotokoll der Microservices mit Status | [Hell](docs/screenshots/de/light/processes.png) | [Graphit](docs/screenshots/de/graphite/processes.png) | [Lager](docs/screenshots/de/warehouse/processes.png) |
| Chat | Organisationschat mit Mitarbeiterverzeichnis | [Hell](docs/screenshots/de/light/chat.png) | [Graphit](docs/screenshots/de/graphite/chat.png) | [Lager](docs/screenshots/de/warehouse/chat.png) |
| Globale Konfiguration | Betreiberweite Einstellungen nach Bereichen | [Hell](docs/screenshots/de/light/global-configuration.png) | [Graphit](docs/screenshots/de/graphite/global-configuration.png) | [Lager](docs/screenshots/de/warehouse/global-configuration.png) |

<details>
<summary>Alle Ansichten im Design Hell</summary>

<p>
  <img src="docs/screenshots/de/light/dashboard.png" alt="Dashboard – Hell" width="49%">
  <img src="docs/screenshots/de/light/shipments.png" alt="Sendungen – Hell" width="49%">
  <img src="docs/screenshots/de/light/shipment-details.png" alt="Sendungsdetails – Hell" width="49%">
  <img src="docs/screenshots/de/light/deliveries.png" alt="Zustellungen – Hell" width="49%">
  <img src="docs/screenshots/de/light/returns.png" alt="Retouren – Hell" width="49%">
  <img src="docs/screenshots/de/light/pallets.png" alt="Paletten – Hell" width="49%">
  <img src="docs/screenshots/de/light/departments.png" alt="Niederlassungen – Hell" width="49%">
  <img src="docs/screenshots/de/light/department-map.png" alt="Niederlassungsplan – Hell" width="49%">
  <img src="docs/screenshots/de/light/delivery-area.png" alt="Zustellgebiet – Hell" width="49%">
  <img src="docs/screenshots/de/light/pickup-points.png" alt="Abholstationen – Hell" width="49%">
  <img src="docs/screenshots/de/light/processes.png" alt="Prozesse – Hell" width="49%">
  <img src="docs/screenshots/de/light/chat.png" alt="Chat – Hell" width="49%">
  <img src="docs/screenshots/de/light/global-configuration.png" alt="Globale Konfiguration – Hell" width="49%">
</p>
</details>

<details>
<summary>Alle Ansichten im Design Graphit</summary>

<p>
  <img src="docs/screenshots/de/graphite/dashboard.png" alt="Dashboard – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/shipments.png" alt="Sendungen – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/shipment-details.png" alt="Sendungsdetails – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/deliveries.png" alt="Zustellungen – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/returns.png" alt="Retouren – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/pallets.png" alt="Paletten – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/departments.png" alt="Niederlassungen – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/department-map.png" alt="Niederlassungsplan – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/delivery-area.png" alt="Zustellgebiet – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/pickup-points.png" alt="Abholstationen – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/processes.png" alt="Prozesse – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/chat.png" alt="Chat – Graphit" width="49%">
  <img src="docs/screenshots/de/graphite/global-configuration.png" alt="Globale Konfiguration – Graphit" width="49%">
</p>
</details>

<details>
<summary>Alle Ansichten im Design Lager</summary>

<p>
  <img src="docs/screenshots/de/warehouse/dashboard.png" alt="Dashboard – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/shipments.png" alt="Sendungen – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/shipment-details.png" alt="Sendungsdetails – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/deliveries.png" alt="Zustellungen – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/returns.png" alt="Retouren – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/pallets.png" alt="Paletten – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/departments.png" alt="Niederlassungen – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/department-map.png" alt="Niederlassungsplan – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/delivery-area.png" alt="Zustellgebiet – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/pickup-points.png" alt="Abholstationen – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/processes.png" alt="Prozesse – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/chat.png" alt="Chat – Lager" width="49%">
  <img src="docs/screenshots/de/warehouse/global-configuration.png" alt="Globale Konfiguration – Lager" width="49%">
</p>
</details>

## Technologie

- React 18 mit TypeScript
- Create React App / `react-scripts`
- Material UI
- React Router
- Axios-HTTP-Clients
- Leaflet für Karten der Sendungsrouten
- QR-Code-Erzeugung für Sendungsetiketten
- Jest und React Testing Library

## Hauptfunktionen

- Anmeldung und authentifizierte HTTP-Clients.
- Anwendungsrahmen mit Tabs und routenabhängigen Tab-Titeln.
- Niederlassungsbezogenes Dashboard mit Sendungs- und Retourenkennzahlen, einem
  Umsatzdiagramm über 7/14/30 Tage, aktueller operativer Aktivität und einer Karte
  der direkten Verbindungen der Niederlassung; die Modul-Kacheln bleiben eine
  separate, wiederverwendbare Komponente.
- Sendungsliste, Erfassungsformular, Detail-/Bearbeitungsansicht und Sendungsverlauf, einschließlich Abhol- und Zustellart.
- Katalog der Abholstationen mit Anlegen, Bearbeiten, Lebenszyklusaktionen, Filtern und Standortkarte.
- Auswahl einer Abholstation auf einer Karte mit Straßen-/Ortssuche beim Anlegen und Bearbeiten einer Sendung; an der Sendung wird die ID der Station gespeichert, angezeigt wird ihr Code.
- Karte des Sendungsverlaufs mit Route über die Niederlassungen und übersetzten Ereignisbezeichnungen.
- Download von Sendungsdokumenten, Vorschau und Druck des QR-Etiketts.
- Retourenerfassung, Liste und Details, Aktionen zum Bearbeiten/Abschließen/Stornieren, Änderung des Grundes und Token-Prüfung.
- Zustellregister mit aktuellen Zustellungen, Bearbeitungsansicht mit Schrittverlauf und Zustellart sowie einer Stornoaktion. Es nutzt `GET /deliveries`, `GET /deliveries/{id}`, `PUT /deliveries/{id}/method` und `POST /deliveries/{id}/cancel` des Managers.
- Niederlassungsliste und Anlegen von Niederlassungen. Die Liste zeigt eine Karte der gespeicherten Zustellgebietsgrenzen und Standorte entsprechend den Listenfiltern. Ein Klick auf eine Niederlassung öffnet einen eigenen Tab (`/departments/:departmentId`) mit bearbeitbaren Daten, Benutzern, Niederlassungsplan und Editor für das Zustellgebiet.
- Editor für Zustellgebiete: mehrere Grenzen auf einer großen Leaflet-Karte zeichnen (mit erweiterter Ansicht), eine Grenze am Startpunkt schließen, Eckpunkte hinzufügen oder ziehen und einen Entwurf im lokalen Speicher des Browsers sichern. Unter Globale Konfiguration → Niederlassungen teilt die Einstellung für automatische Zustellgebiete Polen beim Speichern und nach dem Anlegen einer Niederlassung unter den aktiven Niederlassungen mit gültigen Koordinaten auf. Sie ersetzt lokale Entwürfe der beteiligten Niederlassungen. Im selben Bereich kann jede neue Niederlassung mit dem nächstgelegenen aktiven Sortierzentrum verbunden und das Löschen oder Archivieren von Niederlassungen in der GUI ausgeblendet werden. Diese Schalter und Gebietsentwürfe sind lokal im Browser gespeichert; die API erzwingt diese Einschränkungen nicht. Netzverbindungen werden über die API des Zustellnetzes gespeichert. Gebietsentwürfe wirken sich nicht auf die Zuordnung von Sendungen aus. Entfernungen werden in einer näherungsweisen ebenen Kartenprojektion berechnet; Straßen und Fahrzeiten werden nicht berücksichtigt. Der mitgelieferte, näherungsweise Umriss Polens stammt aus [Natural Earth 1:10m Admin-0](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) über den [geo-countries-GeoJSON-Datensatz](https://github.com/datasets/geo-countries) (gemeinfrei).
- Niederlassungsplan: SVG-Editor in Draufsicht für Räume, Wände, Gänge, Zonen, Regale und Lagerplätze (Zoom, Verschieben der Ansicht, Raster, Bewegen, Drehen, Größe ändern, Rückgängig) sowie ein Betriebsmodus zum Einlagern, Umlagern, Reservieren, Suchen und Verfolgen von Palettenstellplätzen. Er nutzt die `/department-maps`-Endpunkte des Managers.
- Kurierliste, Details und Anlegen von Kurieren.
- Prozessliste und Prozessdetails.
- Benutzerverwaltung mit Dialogen zum Anlegen, Bearbeiten sowie für Rollen und Berechtigungen.
- Organisationschat auf Basis des echten Benutzerverzeichnisses und dauerhafter REST-Unterhaltungen, mit Suche und Gesprächsblasen unten rechts.
- Gerätekopplung.
- Bereiche für globale Konfiguration, Geokodierung und Integrationen.
- Liste der Softwarekonfigurationen.
- Statusseite der Microservices.
- Benutzerprofilseite.
- Super-Admin-Anwendung mit eigener Anmeldung und Betreiberverwaltung.
- Abonnementpläne für Betreiber (`MINI`, `BASIC`, `ENTERPRISE`), verwaltet im Betreiberbereich des Super-Admins; Betreiber
  ohne Plan oder mit abgelaufenem bzw. noch nicht begonnenem Plan sehen einen Hinweis, sich an den Support zu wenden.
- Polnische, englische und deutsche Übersetzungen.

Einige Routen sind Platzhalter für geplante Module, z. B. Analysen, Fahrzeuge,
Paletten, Scanner, Kurierzustellungen, Lieferanten, Verträge, Abrechnung und
Support.

## Projektstruktur

| Pfad | Zweck |
| --- | --- |
| `src/components` | Seiten der Anwendung und UI-Module. |
| `src/components/AppShell` | Hauptlayout, Routing, Tabs und deren Speicherung. |
| `src/auth` | Authentifizierungssitzung und Typen des Benutzerprofils. |
| `src/hooks` | API-Services und domänenspezifische HTTP-Wrapper. |
| `src/api` | Gemeinsamer Backend-Client und Hilfen für API-Ergebnisse/-Fehler. |
| `src/config` | Anwendungsversion, Umgebung und Einstellungen des Betriebsprofils. |
| `src/i18n` | Übersetzungen `pl`, `en`, `de` und Sprachhilfen. |
| `src/theme` | Gemeinsames visuelles Design. |
| `src/utils` | Kleine gemeinsame Hilfsfunktionen. |
| `docker/nginx` | Nginx-Konfiguration für das produktive Docker-Image. |

## Konfiguration

Das Projekt verwendet Umgebungsvariablen von Create React App. Lokale Standardwerte
liegen in `.env`.

Wichtige Variablen:

- `REACT_APP_SERVER_URL` - Haupt-API des Managers, Standard `http://localhost:8080/v1/api`
- `REACT_APP_MANAGER_API_URL` - Alias der Manager-API
- `REACT_APP_GATEWAY_URL` - Gateway-URL, Standard `http://localhost:8088/gateway`
- `REACT_APP_SOFTWARE_CONFIGURATION_URL` - Dienst für Softwarekonfiguration
- `REACT_APP_DELIVERY_PROTECTION_URL` - Dienst für Zustellschutz
- `REACT_APP_RETURNING_TRACK_MANAGER_URL` - Retourendienst
- `REACT_APP_ROUTE_TRACKER_FLOW_URL` - Dienst zur Routenverfolgung
- `REACT_APP_VERSION` - angezeigte Anwendungsversion
- `REACT_APP_MAP_TILE_URL` - URL-Vorlage für Leaflet-Kacheln
- `REACT_APP_MAP_TILE_ATTRIBUTION` - auf der Karte angezeigte Quellenangabe

Sind die Kachelvariablen nicht gesetzt, verwendet die Anwendung
`https://tile.openstreetmap.org/{z}/{x}/{y}.png` mit OpenStreetMap-Quellenangabe.

## Verfügbare Skripte

Die UI-Styles sind in gemeinsame Bedienelemente und funktionsbezogene Styles
aufgeteilt. Dateizuständigkeit und Kaskadenregeln beschreibt
[Technical UI](src/theme/technical/README.md). Stylesheet-Importe und den
Grundtextkontrast aller Designs prüfst du mit:

```bash
npm run check:styles
```

Abhängigkeiten installieren:

```bash
npm install
```

Entwicklungsserver starten:

```bash
npm start
```

Tests ausführen:

```bash
npm test -- --watchAll=false
```

Produktions-Build erstellen:

```bash
npm run build
```

## Docker

Das Docker-Image baut die React-App mit Node 20 und liefert die erzeugten
statischen Dateien über Nginx auf Port `80` aus.

```bash
docker build -t manager-v2-gui .
```

Relevante Build-Argumente:

- `REACT_APP_SERVER_URL`
- `REACT_APP_GATEWAY_URL`
- `REACT_APP_VERSION`
- `REACT_APP_ENVIRONMENT`

## Erwartungen an das Backend

Für die lokale Entwicklung erwartet das Frontend das Manager-Backend unter
`http://localhost:8080/v1/api` und das Gateway unter `http://localhost:8088/gateway`.
Die Authentifizierung basiert auf Cookies/JWT, und die CORS-Konfiguration des
Backends muss den GUI-Ursprung erlauben, üblicherweise `http://localhost:3000`.

Release Notes werden in `CHANGELOG.md` gepflegt.
