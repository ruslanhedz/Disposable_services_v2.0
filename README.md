# Ten projekt został utworzony w celu wykonania zadania praktycznego pracy dyplomowej "Stworzenie systemu uruchamiania środowisk jednorazowego użycia oraz analiza poziomu izolacji i odporności na szkodliwe oprogramowanie" na Politechnice Wrocławskiej.


## Stos technologiczny:

- Backend - serwer Django
- Frontend - React
- MySQL - baza danych przechowująca dane logujące oraz dane sesji użytkowników
- Redis - nierelacyjna baza danych dla kolejki zadań Celery
- Guacamole - brama zdalnego dostępu do połączeń VNC oraz RDP
- Docker & Docker Compose - orkiestracja wielokontenerowej aplikacji


## Backend

- Do uruchomienia serwera Django wymagane jest przygotowanie pliku `.env`, który nie został zamieszczony tutaj ze względów bezpieczeństwa aplikacji. Musi ten plik zawierać sekretny klucz aplikacji Django, dane bazy danych, serwera smtp oraz dane logujące do maszyn wirtualnych sesji.

- W niniejszym projekcie serwer Django posiada dwie aplikacje wewnętrzne:
    - `reg_log` - aplikacja odpowiadające za rejestrację oraz logowanie użytkowników do platformy
    - `session_manager` - aplikacja odpowiadająca za założenie sesji przez użytkowników. Do jej obowiązków należą:
        - Utworzenie sesji na serwerze Guacamole,
        - Uruchomienie/usunięcie instancji na chmurze,
        - Automatyczne usunięcie sesji użytkownika po jej wygaśnięciu.

- Serwer django został uruchomiony używający połączenia https przy pomocy asgi.

## Frontend

- Jest to interfejs użytkownika napisany w języku React w połączeniu z narzędziem Vite.

- W katalogu `frontend/src/pages` znajduje się kod każdej strony interfejsu użytkownika.

- W końcowej wersji projektu zbudowane pliki React zostały uruchomione używając AWS Amplify.

## MySQL

- Do głównej bazy danych w projekcie wybrano MySQL. W końcowej wersji projektu była ona tworzona przy pomocy AWS RDS.

- Uwaga! Zamieszczony w katalogie głównym `docker-compose.yml` przedstawia uruchomienie kontenerów MySQL oraz Redis, który były wykorzystywane podczas pracy lokalnej. Uruchamiana przy pomocy tego pliku baza danych nie posiada zaszyfrowanego połączenia.

## Redis

- Nierelacyjna baza danych redis jest wykorzystywana w projekcie dla szybkiego zarządzania kolejką zadań Celery służącą dla usunięcia sesji użytkownika po wygaśnięćiu.

## Guacamole

- Guacamole służy w danej aplikacji jako brama zdalnego dostępu do instancji przy pomocy protokołów VNC oraz RDP. W katalogu `Guacamole` znajdują się pliki `docker-compose.yml` oraz konfiguracyjny plik dla `guacd`. 

- Guacamole został skonfigurowany dla umożliwienia uwierzytelniania użytkownika przy pomocy JSON.

- Uwaga! Ten kod źródłowy nie posiada klucza sekretnego Guacamole oraz certyfikatów dla `guacd` oraz `Guacamole`. W przypadku generowania certyfikatów dla tych kontenerów, należy pamiętać o dodaniu wykorzystywanych przez `guacd` certyfikatów do zaufanych wewnątrz kontenera `Guacamole`.


------------------------------------------------------------------------------------------------------------------------------------------

# This project was created as part of the practical component of the diploma thesis “Creation of a system for launching disposable environments and analysis of the level of isolation and resilience to malicious software” at Wrocław University of Science and Technology.

## Technology stack

- Backend – Django server
- Frontend – React
- MySQL – database storing login data and user session data
- Redis – non‑relational database used as a queue backend for Celery tasks
- Guacamole – remote access gateway for VNC and RDP connections
- Docker & Docker Compose – orchestration of the multi‑container application

## Backend

- To run the Django server you must prepare a `.env` file, which is not included here for security reasons. This file has to contain the Django secret key, database credentials, SMTP server settings and login data for the virtual machines used by the sessions.

- In this project the Django server contains two internal applications:
  - `reg_log` – application responsible for user registration and login to the platform
  - `session_manager` – application responsible for creating user sessions. Its responsibilities include:
    - Creating a session on the Guacamole server
    - Starting/removing instances in the cloud
    - Automatically deleting the user’s session after it expires

- The Django server is run over HTTPS using ASGI.

## Frontend

- The user interface is written in React and built with Vite.

- The `frontend/src/pages` directory contains the code for each user‑interface page.

- In the final version of the project, the built React files are hosted using AWS Amplify.

## MySQL

- MySQL was chosen as the main database for the project. In the final version it is provisioned using AWS RDS.

- Note: the `docker-compose.yml` file in the repository root starts MySQL and Redis containers used during local development. The database started with this file does not use encrypted connections.

## Redis

- The Redis non‑relational database is used for fast management of the Celery task queue that deletes user sessions after they expire.

## Guacamole

- In this application Guacamole acts as a remote access gateway to instances over VNC and RDP. The `Guacamole` directory contains a `docker-compose.yml` file and a configuration file for `guacd`.

- Guacamole is configured to allow user authentication using JSON.

- Note: this source code does not include the Guacamole secret key or certificates for `guacd` and Guacamole. When generating certificates for these containers, remember to add the certificates used by `guacd` to the trusted store inside the Guacamole container.
