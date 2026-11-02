# Manager 2.0 GUI

[English](README.md) | **Polski** | [Deutsch](README.de.md)

**Wersja rozwojowa 2026.4 - 10 września 2026**

Manager 2.0 GUI to frontend w React/TypeScript dla backendu logistycznego
Manager 2.0. Zawiera ekrany magazynu, przesyłek, procesów, oddziałów, kurierów,
użytkowników i konfiguracji, a także osobny obszar superadministratora.

![Pulpit oddziału](docs/screenshots/pl/light/dashboard.png)

## O aplikacji

Manager 2.0 to aplikacja biurowa dla firm kurierskich i logistycznych. Po
zalogowaniu pracownik widzi pulpit swojego oddziału: liczbę przesyłek, aktywne
zwroty, obrót, wykres wolumenu z 7/14/30 dni oraz mapę połączonych oddziałów.
Z górnego menu rejestruje i śledzi przesyłki, obsługuje doręczenia i zwroty,
tworzy palety, zarządza oddziałami wraz z obszarami doręczeń i planami magazynu,
prowadzi katalog punktów odbioru i paczkomatów, przegląda procesy backendu
i rozmawia ze współpracownikami na czacie organizacji. Każdy ekran otwiera się
w osobnej karcie, więc można równolegle pracować na kilku przesyłkach lub
oddziałach. Interfejs jest zwarty i oparty na tabelach, z mapami
(OpenStreetMap/Leaflet) tam, gdzie liczy się lokalizacja. Aplikacja jest dostępna
po polsku, angielsku i niemiecku i ma zestaw motywów; poniższe zrzuty pokazują
motywy Jasny, Grafitowy i Magazyn.

## Zrzuty ekranu

Te same ekrany w trzech z dostępnych motywów. Kliknij miniaturę lub nazwę motywu, aby otworzyć obraz w pełnym rozmiarze.

<table>
  <tr>
    <th>Jasny</th>
    <th>Grafitowy</th>
    <th>Magazyn</th>
  </tr>
  <tr>
    <td><a href="docs/screenshots/pl/light/dashboard.png"><img src="docs/screenshots/pl/light/dashboard.png" alt="Pulpit – Jasny"></a></td>
    <td><a href="docs/screenshots/pl/graphite/dashboard.png"><img src="docs/screenshots/pl/graphite/dashboard.png" alt="Pulpit – Grafitowy"></a></td>
    <td><a href="docs/screenshots/pl/warehouse/dashboard.png"><img src="docs/screenshots/pl/warehouse/dashboard.png" alt="Pulpit – Magazyn"></a></td>
  </tr>
</table>

| Ekran | Co pokazuje | Jasny | Grafitowy | Magazyn |
| --- | --- | --- | --- | --- |
| Pulpit | Wskaźniki oddziału, wykres obrotu, mapa sieci | [Jasny](docs/screenshots/pl/light/dashboard.png) | [Grafitowy](docs/screenshots/pl/graphite/dashboard.png) | [Magazyn](docs/screenshots/pl/warehouse/dashboard.png) |
| Przesyłki | Lista przesyłek z zakładkami statusów, filtrami i akcjami | [Jasny](docs/screenshots/pl/light/shipments.png) | [Grafitowy](docs/screenshots/pl/graphite/shipments.png) | [Magazyn](docs/screenshots/pl/warehouse/shipments.png) |
| Szczegóły przesyłki | Dane, doręczenie, historia, koszty, etykieta QR i eksport | [Jasny](docs/screenshots/pl/light/shipment-details.png) | [Grafitowy](docs/screenshots/pl/graphite/shipment-details.png) | [Magazyn](docs/screenshots/pl/warehouse/shipment-details.png) |
| Doręczenia | Rejestr doręczeń z trasą, stanem i krokami | [Jasny](docs/screenshots/pl/light/deliveries.png) | [Grafitowy](docs/screenshots/pl/graphite/deliveries.png) | [Magazyn](docs/screenshots/pl/warehouse/deliveries.png) |
| Zwroty | Wyszukiwanie zwrotów i tabela zwrotów oddziału | [Jasny](docs/screenshots/pl/light/returns.png) | [Grafitowy](docs/screenshots/pl/graphite/returns.png) | [Magazyn](docs/screenshots/pl/warehouse/returns.png) |
| Palety | Palety z przewoźnikiem, etykietami i dokumentami transportowymi | [Jasny](docs/screenshots/pl/light/pallets.png) | [Grafitowy](docs/screenshots/pl/graphite/pallets.png) | [Magazyn](docs/screenshots/pl/warehouse/pallets.png) |
| Oddziały | Mapa obszarów doręczeń i lista oddziałów | [Jasny](docs/screenshots/pl/light/departments.png) | [Grafitowy](docs/screenshots/pl/graphite/departments.png) | [Magazyn](docs/screenshots/pl/warehouse/departments.png) |
| Mapa oddziału | Plan magazynu z lokalizacjami palet | [Jasny](docs/screenshots/pl/light/department-map.png) | [Grafitowy](docs/screenshots/pl/graphite/department-map.png) | [Magazyn](docs/screenshots/pl/warehouse/department-map.png) |
| Obszar doręczeń | Rysowanie obszaru obsługiwanego przez oddział | [Jasny](docs/screenshots/pl/light/delivery-area.png) | [Grafitowy](docs/screenshots/pl/graphite/delivery-area.png) | [Magazyn](docs/screenshots/pl/warehouse/delivery-area.png) |
| Punkty odbioru | Katalog punktów odbioru i paczkomatów na mapie | [Jasny](docs/screenshots/pl/light/pickup-points.png) | [Grafitowy](docs/screenshots/pl/graphite/pickup-points.png) | [Magazyn](docs/screenshots/pl/warehouse/pickup-points.png) |
| Procesy | Log procesów mikroserwisów ze statusem | [Jasny](docs/screenshots/pl/light/processes.png) | [Grafitowy](docs/screenshots/pl/graphite/processes.png) | [Magazyn](docs/screenshots/pl/warehouse/processes.png) |
| Czat | Czat organizacji z katalogiem pracowników | [Jasny](docs/screenshots/pl/light/chat.png) | [Grafitowy](docs/screenshots/pl/graphite/chat.png) | [Magazyn](docs/screenshots/pl/warehouse/chat.png) |
| Konfiguracja globalna | Ustawienia operatora w podziale na sekcje | [Jasny](docs/screenshots/pl/light/global-configuration.png) | [Grafitowy](docs/screenshots/pl/graphite/global-configuration.png) | [Magazyn](docs/screenshots/pl/warehouse/global-configuration.png) |

<details>
<summary>Wszystkie ekrany w motywie Jasny</summary>

<p>
  <img src="docs/screenshots/pl/light/dashboard.png" alt="Pulpit – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/shipments.png" alt="Przesyłki – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/shipment-details.png" alt="Szczegóły przesyłki – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/deliveries.png" alt="Doręczenia – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/returns.png" alt="Zwroty – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/pallets.png" alt="Palety – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/departments.png" alt="Oddziały – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/department-map.png" alt="Mapa oddziału – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/delivery-area.png" alt="Obszar doręczeń – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/pickup-points.png" alt="Punkty odbioru – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/processes.png" alt="Procesy – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/chat.png" alt="Czat – Jasny" width="49%">
  <img src="docs/screenshots/pl/light/global-configuration.png" alt="Konfiguracja globalna – Jasny" width="49%">
</p>
</details>

<details>
<summary>Wszystkie ekrany w motywie Grafitowy</summary>

<p>
  <img src="docs/screenshots/pl/graphite/dashboard.png" alt="Pulpit – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/shipments.png" alt="Przesyłki – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/shipment-details.png" alt="Szczegóły przesyłki – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/deliveries.png" alt="Doręczenia – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/returns.png" alt="Zwroty – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/pallets.png" alt="Palety – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/departments.png" alt="Oddziały – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/department-map.png" alt="Mapa oddziału – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/delivery-area.png" alt="Obszar doręczeń – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/pickup-points.png" alt="Punkty odbioru – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/processes.png" alt="Procesy – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/chat.png" alt="Czat – Grafitowy" width="49%">
  <img src="docs/screenshots/pl/graphite/global-configuration.png" alt="Konfiguracja globalna – Grafitowy" width="49%">
</p>
</details>

<details>
<summary>Wszystkie ekrany w motywie Magazyn</summary>

<p>
  <img src="docs/screenshots/pl/warehouse/dashboard.png" alt="Pulpit – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/shipments.png" alt="Przesyłki – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/shipment-details.png" alt="Szczegóły przesyłki – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/deliveries.png" alt="Doręczenia – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/returns.png" alt="Zwroty – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/pallets.png" alt="Palety – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/departments.png" alt="Oddziały – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/department-map.png" alt="Mapa oddziału – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/delivery-area.png" alt="Obszar doręczeń – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/pickup-points.png" alt="Punkty odbioru – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/processes.png" alt="Procesy – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/chat.png" alt="Czat – Magazyn" width="49%">
  <img src="docs/screenshots/pl/warehouse/global-configuration.png" alt="Konfiguracja globalna – Magazyn" width="49%">
</p>
</details>

## Technologie

- React 18 z TypeScript
- Create React App / `react-scripts`
- Material UI
- React Router
- Klienty HTTP oparte na Axios
- Leaflet do map tras przesyłek
- Generowanie kodów QR na etykiety przesyłek
- Jest i React Testing Library

## Główne funkcje

- Logowanie i uwierzytelnione klienty HTTP.
- Powłoka aplikacji z kartami i tytułami kart zależnymi od trasy.
- Pulpit oddziału z metrykami przesyłek i zwrotów, wykresem obrotu z 7/14/30 dni,
  ostatnią aktywnością operacyjną i mapą bezpośrednich połączeń oddziału; kafelki
  nawigacji po modułach pozostają osobnym komponentem wielokrotnego użytku.
- Lista przesyłek, formularz tworzenia, widok szczegółów/edycji i historia przesyłki, w tym sposób nadania i doręczenia.
- Katalog punktów odbioru z tworzeniem, edycją, akcjami cyklu życia, filtrami i mapą lokalizacji.
- Wybór punktu odbioru z mapy z wyszukiwaniem po ulicy/mieście podczas tworzenia i edycji przesyłki; w przesyłce zapisywany jest identyfikator punktu, a użytkownikowi pokazywany jest jego kod.
- Mapa historii przesyłki z trasą przez oddziały i przetłumaczonymi nazwami zdarzeń.
- Pobieranie dokumentów przesyłki, podgląd i wydruk etykiety QR.
- Rejestracja zwrotów, lista i szczegóły, akcje przetwarzania/zakończenia/anulowania, zmiana powodu i walidacja tokenu.
- Rejestr doręczeń z ostatnimi doręczeniami, ekran edycji z historią kroków i sposobem doręczenia oraz akcja anulowania. Korzysta z `GET /deliveries`, `GET /deliveries/{id}`, `PUT /deliveries/{id}/method` i `POST /deliveries/{id}/cancel` Managera.
- Lista oddziałów i tworzenie oddziału. Lista pokazuje mapę zapisanych granic obszarów doręczeń i lokalizacji oddziałów zgodnie z filtrami listy. Kliknięcie oddziału otwiera osobną kartę (`/departments/:departmentId`) z edytowalnymi danymi, użytkownikami, mapą oddziału i edytorem obszaru doręczeń.
- Edytor obszaru doręczeń: rysowanie wielu granic na dużej mapie Leaflet (z widokiem rozszerzonym), zamykanie granicy w punkcie początkowym, dodawanie i przeciąganie wierzchołków oraz zapis szkicu w pamięci lokalnej przeglądarki. W Konfiguracja globalna → Oddziały ustawienie automatycznego obszaru doręczeń dzieli Polskę między aktywne oddziały z poprawnymi współrzędnymi przy zapisie i po utworzeniu oddziału. Zastępuje lokalne szkice uczestniczących oddziałów. W tej samej sekcji można łączyć każdy nowy oddział z najbliższą aktywną sortownią oraz ukryć w GUI usuwanie i archiwizację oddziałów. Te flagi i szkice obszarów są lokalne dla przeglądarki; API nie egzekwuje tych ograniczeń. Połączenia sieci są zapisywane przez API sieci doręczeń. Szkice obszarów nie wpływają na przypisywanie przesyłek. Odległość liczona jest w przybliżonym płaskim rzucie mapy; drogi i czas przejazdu nie są brane pod uwagę. Dołączony, przybliżony kontur Polski pochodzi z [Natural Earth 1:10m Admin-0](https://www.naturalearthdata.com/downloads/10m-cultural-vectors/10m-admin-0-countries/) przez [zbiór GeoJSON geo-countries](https://github.com/datasets/geo-countries) (domena publiczna).
- Mapa oddziału: edytor SVG w widoku z góry dla pomieszczeń, ścian, alejek, stref, regałów i miejsc składowania (zoom, przesuwanie, siatka, przenoszenie, obrót, zmiana rozmiaru, cofanie) oraz tryb operacyjny do odkładania, przenoszenia, rezerwowania, wyszukiwania i śledzenia lokalizacji palet. Korzysta z endpointów `/department-maps` Managera.
- Lista kurierów, szczegóły i tworzenie kuriera.
- Lista procesów i szczegóły procesu.
- Zarządzanie użytkownikami z oknami tworzenia, edycji, ról i uprawnień.
- Czat organizacji oparty na prawdziwym katalogu użytkowników i trwałych rozmowach REST, z wyszukiwaniem i dymkami rozmów zgrupowanymi w prawym dolnym rogu.
- Parowanie urządzeń.
- Panele konfiguracji globalnej, geokodowania i integracji.
- Lista konfiguracji oprogramowania.
- Strona statusu mikroserwisów.
- Strona profilu użytkownika.
- Aplikacja superadministratora z osobnym logowaniem i zarządzaniem operatorami.
- Plany subskrypcji operatorów (`MINI`, `BASIC`, `ENTERPRISE`) zarządzane w obszarze operatora superadministratora; operatorzy
  bez planu albo z planem wygasłym lub jeszcze nierozpoczętym widzą ekran z prośbą o kontakt z pomocą techniczną.
- Tłumaczenia polskie, angielskie i niemieckie.

Część tras to zaślepki planowanych modułów, np. analityka, pojazdy, palety,
skaner, doręczenia kurierskie, dostawcy, umowy, rozliczenia i pomoc.

## Struktura projektu

| Ścieżka | Przeznaczenie |
| --- | --- |
| `src/components` | Strony aplikacji i moduły UI. |
| `src/components/AppShell` | Główny układ, routing, karty i ich zapamiętywanie. |
| `src/auth` | Sesja uwierzytelniania i typy profilu użytkownika. |
| `src/hooks` | Serwisy API i domenowe opakowania HTTP. |
| `src/api` | Wspólny klient backendu i pomocniki wyników/błędów API. |
| `src/config` | Wersja aplikacji, środowisko i ustawienia profilu operacyjnego. |
| `src/i18n` | Tłumaczenia `pl`, `en`, `de` i pomocniki języka. |
| `src/theme` | Wspólny motyw wizualny. |
| `src/utils` | Drobne wspólne narzędzia. |
| `docker/nginx` | Konfiguracja Nginx dla produkcyjnego obrazu Docker. |

## Konfiguracja

Projekt korzysta ze zmiennych środowiskowych Create React App. Lokalne wartości
domyślne są w `.env`.

Najważniejsze zmienne:

- `REACT_APP_SERVER_URL` - główne API Managera, domyślnie `http://localhost:8080/v1/api`
- `REACT_APP_MANAGER_API_URL` - alias API Managera
- `REACT_APP_GATEWAY_URL` - adres bramy, domyślnie `http://localhost:8088/gateway`
- `REACT_APP_SOFTWARE_CONFIGURATION_URL` - serwis konfiguracji oprogramowania
- `REACT_APP_DELIVERY_PROTECTION_URL` - serwis ochrony doręczeń
- `REACT_APP_RETURNING_TRACK_MANAGER_URL` - serwis zwrotów
- `REACT_APP_ROUTE_TRACKER_FLOW_URL` - serwis śledzenia tras
- `REACT_APP_VERSION` - wyświetlana wersja aplikacji
- `REACT_APP_MAP_TILE_URL` - szablon adresu kafelków Leaflet
- `REACT_APP_MAP_TILE_ATTRIBUTION` - atrybucja wyświetlana na mapie

Jeśli zmienne kafelków mapy nie są ustawione, aplikacja używa
`https://tile.openstreetmap.org/{z}/{x}/{y}.png` z atrybucją OpenStreetMap.

## Dostępne skrypty

Style UI są podzielone na wspólne kontrolki i style należące do funkcji.
Zasady własności plików i kaskady opisuje [Technical UI](src/theme/technical/README.md).
Importy arkuszy stylów i kontrast podstawowego tekstu we wszystkich motywach
sprawdzisz poleceniem:

```bash
npm run check:styles
```

Instalacja zależności:

```bash
npm install
```

Uruchomienie serwera deweloperskiego:

```bash
npm start
```

Uruchomienie testów:

```bash
npm test -- --watchAll=false
```

Budowanie wersji produkcyjnej:

```bash
npm run build
```

## Docker

Obraz Docker buduje aplikację React na Node 20 i serwuje wygenerowane pliki
statyczne przez Nginx na porcie `80`.

```bash
docker build -t manager-v2-gui .
```

Istotne argumenty budowania:

- `REACT_APP_SERVER_URL`
- `REACT_APP_GATEWAY_URL`
- `REACT_APP_VERSION`
- `REACT_APP_ENVIRONMENT`

## Wymagania wobec backendu

Do pracy lokalnej frontend oczekuje backendu Managera pod
`http://localhost:8080/v1/api` i bramy pod `http://localhost:8088/gateway`.
Uwierzytelnianie opiera się na ciasteczkach/JWT, a konfiguracja CORS backendu musi
dopuszczać adres GUI, zwykle `http://localhost:3000`.

Informacje o wydaniach są prowadzone w `CHANGELOG.md`.
