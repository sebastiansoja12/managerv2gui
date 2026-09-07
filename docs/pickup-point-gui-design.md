# PickupPoint — projekt GUI

Status: implementacja rozpoczęta, 2026-09-09. Typy modelu i klient HTTP są gotowe;
opisane ekrany, routing i integracja Shipment nie są jeszcze zaimplementowane.
Model i kontrakt backendu: [PickupPoint backend](../../managerv2/docs/pickup-point-domain-design.md).

## 1. Założenie

Użytkownik zarządza katalogiem punktów i wybiera punkt nadania oraz punkt odbioru podczas tworzenia przesyłki.
Nie wpisuje UUID ręcznie. Dwa wybory pozostają niezależne, również gdy wskazują ten sam punkt.

Projekt wykorzystuje istniejący React/TypeScript, komponenty `components/ui`, routing zakładek,
`BackendClient`, uwierzytelniony `http-common` oraz Leaflet. Nie wymaga nowej biblioteki komponentów ani Vaadin.
Domyślny język PL; wszystkie teksty, błędy, etykiety mapy i aria-label mają odpowiedniki EN i DE.

## 2. Nawigacja

Nowy obszar: **Punkty nadań i odbioru**, pod `/pickup-points`, dostępny w profilu `warehouse`.
Wejście z nawigacji i dashboardu. Szczegóły i edycja otwierają się w istniejącym mechanizmie zakładek.

| Ścieżka | Widok / tytuł |
|---|---|
| `/pickup-points` | Katalog / „Punkty nadań i odbioru”. |
| `/pickup-points/new` | „Nowy punkt”. |
| `/pickup-points/:pickupPointId` | Szczegóły / „Punkt WAW-PP-001”. |
| `/pickup-points/:pickupPointId/edit` | „Edycja WAW-PP-001”. |

Aktualizowane miejsca: `AppRoutes.tsx`, `tabConfig.ts`, `operationalProfile.ts`, `HomeDashboard.tsx`,
`Navbar.tsx`, tłumaczenia. Dostęp do tras dynamicznych trzeba obsłużyć jawnie — obecna lista profili
nie dopuszcza automatycznie dowolnego podadresu.
Profil courier nie otrzymuje w tym etapie zarządzania punktami. Uprawnienia operacji sprawdza backend;
kontrolki GUI odzwierciedlają aktualne uprawnienia, nie zastępują kontroli serwera.

## 3. Katalog

Domyślnie lista aktywnych punktów, 25 wyników na stronę; przełącznik „Wszystkie statusy” ujawnia też
zawieszone i zamknięte punkty. Filtry zapisane w URL umożliwiają powrót do tego samego zestawu.

```text
Punkty nadań i odbioru                                 [+ Nowy punkt]
[Kod, nazwa, adres…] [Typ ▾] [Usługa ▾] [Status ▾] [Oddział ▾]
[Kraj ▾] [Miasto…]                             [Lista | Mapa]

Kod          Nazwa              Typ       Usługi    Status   Oddział
WAW-PP-001   Punkt przy Dworcu   Punkt     N / O     Aktywny  WAW
WAW-AP-002   Automat Parking    Automat   N / O     Aktywny  WAW

1–25 z 83                                            [‹] 1 2 3 4 [›]
```

Kolumny: kod, nazwa i skrócony adres, typ, nadania/odbiory, status, oddział, „Otwarte teraz”, akcje.
Kliknięcie nazwy otwiera szczegóły; ikony akcji mają etykiety i tooltipy. Status i usługi mają tekst,
nie są przekazywane wyłącznie kolorem. Wąski ekran pokazuje karty tych samych wyników.

Wyszukiwanie tekstowe z opóźnieniem około 300 ms i odrzucaniem nieaktualnych odpowiedzi.
Zmiana filtra wraca na pierwszą stronę. Backend odpowiada za filtrowanie i stronicowanie.
Nie pobieramy całego katalogu do przeglądarki i nie filtrujemy wyłącznie jednej pobranej strony.

Mapa pobiera niezależnie wszystkie strony wyników dla aktywnych filtrów tabeli. Kliknięcie wiersza przybliża
jego marker, a kliknięcie markera zaznacza odpowiadający mu wiersz. Gdy backend nie zwróci współrzędnych,
komponent prezentuje „Brak punktów ze współrzędnymi do pokazania na mapie”.

## 4. Formularz utworzenia i edycji

Jedna strona z czytelnymi grupami pól, zgodna z gęstymi ekranami operacyjnymi aplikacji.

| Grupa | Pola i zachowanie |
|---|---|
| Dane punktu | Kod, nazwa, typ: punkt obsługiwany/automat. Kod tylko przy tworzeniu. |
| Usługi | „Przyjmuje nadania”, „Wydaje przesyłki odbiorcom”; minimum jedna usługa. |
| Adres i położenie | Kraj, kod pocztowy, miasto, ulica, budynek i lokal; współrzędne wyznacza backend przez PathFinder. |
| Obsługa logistyczna | Oddział z katalogu bieżącego operatora; aktywny wymagany do aktywacji punktu. |
| Dostępność | Strefa czasowa, 24/7 lub siedem dni tygodnia, przedziały, wyjątki dla dat. |
| Kontakt i dostęp | Telefon, e-mail, instrukcja dotarcia. |
| Ograniczenia usług | Obsługiwane standardowe rozmiary, zgoda na dangerous goods domyślnie wyłączona. |
| Identyfikacja zewnętrzna | Opcjonalna para: sieć i kod punktu w sieci; oba pola wypełnione albo oba puste. |

Przykład wiersza harmonogramu: `Poniedziałek [Przedziały ▾] [08:00–12:00] [13:00–18:00] [+]`.
Opcje dnia: „Zamknięte”, „Całą dobę”, „Przedziały”. Wyjątek datowany zastępuje cały dzień.
Przedział nocny edytor rozbija na dwa dni; backend również sprawdza poprawność danych.

„Dodaj punkt” tworzy kompletny punkt w statusie `ACTIVE`; „Zapisz zmiany” aktualizuje konfigurację.
Formularz nie przyjmuje współrzędnych. Backend wyznacza je przez PathFinder podczas
tworzenia oraz ponownie po każdej zmianie adresu.

Kod punktu jest niezmienny. Nazwę, typ, usługi, adres, oddział i politykę dangerous goods można edytować;
zmiana adresu powoduje ponowne geokodowanie po stronie backendu. W `CLOSED` cały formularz jest tylko
do odczytu.

Walidacja przy polach: wymagane wartości, długości, kod, kompletność par,
przedziały godzin i minimum jednej usługi. Backend pozostaje autorytatywny dla unikalności, operatora,
statusu oddziału i przejść stanu. Błąd nie czyści wprowadzonych danych.

Przy HTTP 409 konfliktu wersji: „Punkt został zmieniony przez inną osobę. Wczytaj aktualne dane”.
Zachować lokalny formularz do porównania; przycisk ponownego wczytania wymaga potwierdzenia odrzucenia zmian.
Nie ponawiać automatycznie zapisu z nową wersją.

## 5. Szczegóły i cykl życia

Nagłówek: kod, nazwa, typ, status, usługi. Sekcje: adres/mapa, oddział, godziny, kontakt,
polityka oraz metadane utworzenia/zmiany. Aktualne „Otwarte teraz” jest osobne od statusu aktywności.

Akcje zgodne ze stanem i uprawnieniami:

- `ACTIVE`: edycja dozwolonych danych, zawieszenie, zamknięcie.
- `SUSPENDED`: edycja dozwolonych danych, wznowienie, zamknięcie.
- `CLOSED`: odczyt.

Zawieszenie i zamknięcie otwierają dialog z wymaganym powodem. Zamknięcie jasno informuje,
że jest nieodwracalne. Treść wyjaśnia też, że istniejące przesyłki zachowają dotychczasowy przydział.
Formularz statusu blokuje podwójny zapis i prezentuje błędy bez zamykania dialogu.
Nie pokazujemy zajętości ani liczby paczek, dopóki nie istnieje rzeczywiste źródło tych danych.

## 6. Wybór punktów w ShipmentCreate

```text
Nadanie
[Sposób: Punkt nadań ▾]
[WAW-PP-001 · Punkt przy Dworcu · Warszawa] [Zmień] [Usuń]

Doręczenie
[Sposób: Automat paczkowy ▾]
[Wybierz automat odbioru…]
```

Selektor otwiera dialog z wyszukiwaniem, listą i mapą. Wiersz pokazuje nazwę, kod, adres, typ,
godziny i oddział. Kliknięcie markera podświetla wiersz; przycisk „Wybierz punkt” zatwierdza wybór.
Obsługa klawiaturą działa przez listę; mapa nie jest jedyną drogą wykonania operacji.

| Kontekst wyboru | Parametry endpointu `/pickup-points/eligible` |
|---|---|
| Nadanie `PICKUP_POINT` | `DROP_OFF`, `SERVICE_POINT`, kraj nadawcy, rozmiar i dangerous goods. |
| Nadanie `LOCKER` | `DROP_OFF`, `PARCEL_LOCKER`, kraj nadawcy, rozmiar i dangerous goods. |
| Doręczenie `PICKUP_POINT` | `COLLECTION`, `SERVICE_POINT`, kraj odbiorcy, rozmiar i dangerous goods. |
| Doręczenie `LOCKER` | `COLLECTION`, `PARCEL_LOCKER`, kraj odbiorcy, rozmiar i dangerous goods. |

Reguły formularza:

1. Oddzielny stan `originPickupPoint` i `deliveryPickupPoint` zawiera wybrane podsumowania, a request wysyła ID.
2. Brak wymaganego punktu blokuje zapis i pokazuje błąd przy właściwym polu.
3. Zmiana metody na kurierską lub oddziałową usuwa punkt wyłącznie po odpowiadającej stronie.
   Zmiana punkt ↔ automat usuwa niezgodny wybór. Wybór jednej strony nie zmienia drugiej.
4. Zmiana kraju usuwa wybór niezgodnego punktu po tej stronie. Zmiana rozmiaru/dangerous goods
   oznacza konieczność ponownego potwierdzenia przydatności obu punktów; do tego czasu zapis jest zablokowany.
5. Zamknięcie selektora bez zatwierdzenia zachowuje poprzedni wybór. Zapis przechwytuje też
   `PICKUP_POINT_UNAVAILABLE`, ponieważ dostępność mogła zmienić się od otwarcia dialogu.
6. Kopiowanie przesyłki ładuje oba punkty ponownie i wymaga aktualnej walidacji; stary snapshot nie uprawnia do nowego nadania.
7. Przy `CUSTOM` selektor wyjaśnia brak obsługi tego rozmiaru w pierwszym etapie; nie pokazuje fikcyjnej dostępności.
8. Wybranie punktu nie nadpisuje kontaktu/adresu osoby w formularzu. Cel logistyczny wyznacza backend z punktu.

`ShipmentDeliveryPointMapDialog.tsx` pobiera z `/pickup-points/eligible` wszystkie strony punktów odbioru zgodnych
z metodą doręczenia, krajem odbiorcy, rozmiarem przesyłki i dangerous goods. Użytkownik może zawęzić wyniki
po ulicy lub mieście, wybrać punkt z listy albo kliknąć jego marker i zatwierdzić wybór. Wybrany punkt jest
widoczny w formularzu przesyłki. Zamknięcie dialogu przywraca fokus na przycisk, który go otworzył.

## 7. Szczegóły przesyłki

Pokazać dwie podpisane pozycje: „Punkt nadania” i „Punkt odbioru”, z nazwą, kodem i historycznym adresem.
Źródłem jest snapshot zapisany przy tworzeniu, a link „Aktualne dane punktu” prowadzi do katalogu.
Zamknięty lub zawieszony punkt nadal pozostaje widoczny w historii.

Starszy rekord bez snapshotu pokazuje znany identyfikator oraz „Brak historycznych danych punktu”.
Aktualnych danych katalogu nie podpisujemy jako adresu z chwili nadania. Zwykła edycja Shipment
zachowuje punkty; ich zmiana po utworzeniu czeka na dedykowany proces przekierowania.

## 8. Struktura implementacji

```text
src/components/PickupPoints/
  PickupPointCatalog.tsx
  PickupPointDetails.tsx
  PickupPointForm.tsx
  PickupPointSelectorDialog.tsx
  model/PickupPoint.ts
  styles/pickup-point-catalog.css
src/hooks/PickupPointService.ts
```

Typy współdzielone: `PickupPointIdDto`, `PickupPointSummary`, `PickupPointDetails`, `PickupPointStatus`,
`PickupPointType`, `PickupPointCapability`, `OpeningSchedule`, `PickupPointCreateRequest`,
`PickupPointUpdateRequest`, `PickupPointStatusRequest`, `PickupPointSearchQuery`, `PickupPointPage`.
Nie duplikować `PickupPointIdDto` w Shipment — przenieść typ do właściciela i zaktualizować importy.

Serwis używa `new BackendClient(http)` z `http-common`: `search`, `findEligible`, `getById`, `create`,
`update`, `changeStatus`. Requesty używają `{value: string}` dla UUID i identyfikatora oddziału.
Konflikty równoległych zapisów obsługuje wersjonowanie encji przez Hibernate.
Stan ekranów pozostaje lokalny; błędy przechodzą przez istniejącą obsługę `ApiErrorResponse`.

Tłumaczenia w `src/i18n/{pl,en,de}.ts`, importowane jako `pl` z `translate.ts`:
`pickupPoints.title`, `.filters`, `.fields`, `.types`, `.statuses`, `.capabilities`, `.schedule`,
`.actions`, `.selector`, `.validation`, `.errors`, `.empty`, `.map`, `.history`.

| Klucz | PL | EN | DE |
|---|---|---|---|
| `title` | Punkty nadań i odbioru | Drop-off and collection points | Abgabe- und Abholstellen |
| `types.SERVICE_POINT` | Punkt z obsługą | Staffed service point | Bediente Paketstelle |
| `types.PARCEL_LOCKER` | Automat paczkowy | Parcel locker | Paketautomat |
| `capabilities.DROP_OFF` | Nadania | Drop-off | Paketabgabe |
| `capabilities.COLLECTION` | Odbiory | Collection | Paketabholung |
| `statuses.ACTIVE` | Aktywny | Active | Aktiv |
| `statuses.SUSPENDED` | Zawieszony | Suspended | Gesperrt |
| `statuses.CLOSED` | Zamknięty na stałe | Permanently closed | Dauerhaft geschlossen |

To przykładowe brzmienie; podczas implementacji wszystkie pozostałe teksty także muszą trafić do trzech języków.

## 9. Stany i weryfikacja

Ładowanie: szkielet tabeli/listy; nie pokazujemy chwilowego „Brak punktów”.
Pusty katalog: akcja utworzenia dla uprawnionych. Brak dopasowań: usunięcie filtrów.
Brak pasujących punktów w selektorze: wskazanie filtrów i brak możliwości zatwierdzenia.
Błąd API: informacja i ponowienie; błąd kafelków: ostrzeżenie, lista nadal działa.
Po odświeżeniu filtra nie prezentować wcześniejszych wyników jako zgodnych z nowymi kryteriami.
Przy nieudanym zapisie zachować formularz i wybrane punkty. Sukces pokazać dopiero po odpowiedzi backendu.

Planowane testy Jest/React Testing Library:

- trasy stałe i dynamiczne, zakładki, profile oraz odkrywalność modułu;
- filtry, paginacja, ignorowanie spóźnionych odpowiedzi i jawne ograniczenie wyników mapy;
- walidacja tworzenia i edycji, godzin oraz blokada pól zgodnie ze statusem;
- uprawnienia kontrolek, stan zapisu, konflikt wersji bez utraty danych;
- wybór dwóch różnych punktów, tego samego punktu i obu typów; zmiana jednej strony nie zeruje drugiej;
- odpowiednie parametry selektora, brak punktu, zmiana kraju/metody/rozmiaru, odmowa backendu po wyborze;
- mapowanie obu ID w requestach, brak utraty precyzji `DepartmentId`, kopiowanie i historyczne snapshoty;
- tłumaczenia PL/EN/DE, stany loading/error/empty i dostępny selektor bez działającej mapy;
- regresja istniejących `ShipmentCreateDeliveryMap.test.tsx` i `ShipmentCreateDangerousGood.test.tsx`.

Kryterium odbioru: użytkownik może skonfigurować i aktywować punkt, znaleźć go na liście/mapie,
wybrać niezależnie punkt nadania i odbioru, a zapis i późniejsze szczegóły przesyłki zachowują właściwe dane.
