# Moodle Agent

# #📡 Moodle REST API Setup Guide

Dieses Dokument beschreibt die nötigen Schritte, um die Moodle-REST-API mit einem Token-basierten Zugriff zu verwenden – z. B. zum Abrufen von Hausaufgaben, Kursen oder Nutzerdaten per Skript oder Anwendung.

Die Moodle-Instanz läuft auf: `http://localhost:8080`

---

### ✅ Voraussetzungen

- Admin-Zugriff auf Moodle
- Moodle 3.x oder 4.x
- Webservice-Funktionalität aktiviert
- Ein dedizierter Benutzer mit entsprechender Rolle zur Nutzung der API (siehe Hinweis unten)

### 🔧 1. Webservices aktivieren

`Website-Administration → Erweiterte Funktionen`

Aktiviere:

- [x] Webservices aktivieren
- [x] Benutzerdefinierte Webservices aktivieren
- [x] Mobile Webservices aktivieren (optional)

---

## 👤 Hinweis: API-Nutzer & Rolle erforderlich

Für den Zugriff auf die API wird ein Moodle-Benutzer mit einer passenden Rolle benötigt, die die Berechtigung zum Ausführen der gewünschten Webservice-Funktionen hat.  
Beispielhafte Capabilities:

- `moodle/course:view`
- `mod/assign:view`
- `mod/assign:grade`
- `webservice/rest:use`

Stelle sicher, dass die Rolle "Authenticated user" die Berechtigung `webservice/rest:use` hat. Dies ist notwendig, damit die API-Aufrufe funktionieren.

Stelle sicher, dass der Benutzer diese Rolle systemweit zugewiesen bekommt.

---

### 🔌 2. Externen Dienst definieren

1. `Website-Administration → Server → Webservices → Externe Dienste`
2. „Neuen Dienst hinzufügen“ → z. B. **`Custom REST API`**
3. Aktivieren: `[x] Benutzer kann Dienst aktivieren`
4. Speichern

---

### 🔧 3. Funktionen zum Dienst hinzufügen

1. In der Diensteliste → „Funktionen hinzufügen“
2. Beispiel-Funktionen:
   - `mod_assign_get_assignments`
   - `core_course_get_courses`
   - `core_user_get_users`
   - `core_webservice_get_site_info`

---

### 🗝️ 4. Token erzeugen

1. `Website-Administration → Server → Webservices → Token verwalten`
2. „Neuen Token hinzufügen“:
   - **Benutzer:** Der Nutzer mit Rolle (siehe oben)
   - **Dienst:** `Custom REST API`
   - Token speichern und kopieren

---

### 📡 5. Beispiel-API-Aufruf

```bash
curl -X POST https://deine-moodle-site/webservice/rest/server.php \
  -d wstoken=DEIN_TOKEN_HIER \
  -d wsfunction=mod_assign_get_assignments \
  -d moodlewsrestformat=json
```

Gehe zu:

## Zugangsdaten:

### Admin User:

```
username: user
password: Test123!
email: user@example.com

(default password: bitnami)
```

### Student User:

```
username: student
password: Test123!
email: student@example.com

```
