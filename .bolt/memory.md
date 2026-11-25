# Project memory

## Product intent & audience

- **Casa Misti** is a restaurant management admin panel (internal staff tool, not consumer-facing).
- Spanish-language UI throughout.
- Primary user is a **propietario (owner)** who manages the full restaurant operation.
- Features/admin tabs: Vista general, Productos, Equipo y permisos, Ventas y reportes, Reseñas privadas, Mesas y QR, Gastos e insumos.

## Brand personality & voice

- Login screen branded as **Salvia** (likely a sub-brand or app shell name for Casa Misti).
- Tone: clear, direct, supportive Spanish. Error messages are user-friendly and specific.

## Visual design & UX direction

- Login screen uses a **greenish-gray (verde grisáceo)** background per the established design.
- Admin panel uses a tabbed interface with seven top-level sections.
- Auth flow: Firebase Auth (Email/Password + Anonymous enabled) → query `employees/{uid}` in Firestore → validate `role` and `status` → grant access or show specific error.
- Session persistence: reload should keep the user logged in without re-authenticating.
- Error UX: three distinct messages for wrong credentials, inactive/unassigned account, and no connection.

## Decisions, constraints & rationale

- **Firebase** is the backend: Authentication + Firestore.
- Firestore rules (from `firestore.rules`) have been published to production.
- Employee model stored in Firestore collection `employees`, keyed by Firebase Auth UID.
- Document fields: `role` ("owner"), `status` ("active"), `email`, `fullName`.
- Owner UID: `1xo464Z08TYWXFpW2I2CnAb2T3m2`.
- Only users with a valid `role` and `status === "active"` can access the panel; others are blocked with a contact-the-owner message.
- Environment variables for Firebase config are configured and the build is passing.

## Open questions & assumptions

- Login flow is staged for first real test but not yet confirmed working in the Preview.
- Whether non-owner roles (e.g., staff with limited tabs) exist or are defined yet is unclear — currently only the owner role is documented.
- Relationship between "Salvia" (login brand) and "Casa Misti" (product) not fully clarified; assumed Salvia is the app/shell name.
- Anonymous auth is enabled but its intended use case (e.g., QR-based customer views) is not yet confirmed.