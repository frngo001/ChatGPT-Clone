# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e7]:
    - generic [ref=e8]:
      - img "Agent AI Logo" [ref=e10]
      - generic [ref=e11]: Willkommen zurück
      - generic [ref=e12]: Melden Sie sich bei Ihrem Agent AI Konto an
    - generic [ref=e14]:
      - generic [ref=e15]:
        - generic [ref=e16]:
          - generic [ref=e17]: E-Mail
          - textbox "E-Mail" [ref=e18]:
            - /placeholder: m@beispiel.com
        - generic [ref=e19]:
          - generic [ref=e20]:
            - generic [ref=e21]: Passwort
            - link "Passwort vergessen?" [ref=e22]:
              - /url: /forgot-password
          - generic [ref=e23]:
            - textbox "Passwort" [ref=e24]:
              - /placeholder: Ihr Passwort
            - button [ref=e25] [cursor=pointer]:
              - img
        - button "Anmelden" [ref=e26] [cursor=pointer]
      - generic [ref=e27]:
        - text: Noch kein Konto?
        - link "Registrieren" [ref=e28]:
          - /url: /register
  - region "Notifications alt+T"
```