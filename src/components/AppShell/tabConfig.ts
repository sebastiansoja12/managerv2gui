export const tabTitles: Record<string, string> = {
    "/": "Strona startowa",
    "/shipments": "Lista przesyłek",
    "/shipments/list": "Lista przesyłek",
    "/shipments/create": "Utwórz przesyłkę",
    "/depots": "Oddziały",
    "/parcels": "Lista przesyłek",
    "/login": "Logowanie",
    "/software-configurations": "Software",
};

export const normalizePath = (path: string) => path === "/shipments" ? "/shipments/list" : path;
