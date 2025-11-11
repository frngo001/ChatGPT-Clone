📘 **Local Differential Privacy (LDP)** ist ein datenschutzförderndes Framework, das sicherstellt, dass individuelle Datenpunkte privatisiert werden, bevor sie an einen Datensammler gesendet werden. Im Gegensatz zum klassischen Differential Privacy-Modell, bei dem ein vertrauenswürdiger Dritter die Rohdaten sieht, gewährleistet LDP, dass jeder Datenpunkt bereits auf der Ebene des einzelnen Nutzers randomisiert wird.

> Dies bedeutet, dass selbst der Datensammler keine Rückschlüsse auf die ursprünglichen Rohdaten ziehen kann.

---

### 🔍 **Wie funktioniert LDP?**

Bei LDP werden die Rohdaten $(X_i, Y_i)$ – bestehend aus Merkmalsvektoren $X_i$ und Antwortvariablen $Y_i$ – durch Hinzufügen von Rauschen privatisiert. Ein typischer Mechanismus ist:

- **Diskretisierung** des Merkmalsraums in Zellen $A_{h,j}$ (z.B. Würfel der Kantenlänge $h$)
- **Hinzufügen von Laplace-Rauschen** zu den Indikatorfunktionen und Response-Variablen:

$$
Z_{i,j} := [Y_i]_{-M_n}^{M_n} \cdot I_{\{X_i \in A_{h,j}\}} + \sigma_Z \epsilon_{i,j}
$$

$$
W_{i,j} := I_{\{X_i \in A_{h,j}\}} + \sigma_W \zeta_{i,j}
$$

Hier sind $\epsilon_{i,j}$ und $\zeta_{i,j}$ unabhängige Laplace-verteilte Rauschvariablen mit Einheitsvarianz.

---

### 🛡️ **Privatsphäre-Garantie**

Der Mechanismus erfüllt die $\alpha$-LDP-Bedingung, wenn für alle möglichen Ausgaben $w,z$ und alle Eingabepaare $(x,y), (x',y')$ gilt:

$$
\frac{q_{W,Z|X,Y}(w,z|x,y)}{q_{W,Z|X,Y}(w,z|x',y')} \leq e^{\alpha}
$$

Für den oben beschriebenen Mechanismus wird dies erreicht, wenn:

$$
2^{3/2}\left(\frac{1}{\sigma_W} + \frac{M}{\sigma_Z}\right) \leq \alpha
$$

---

### 📈 **Anwendung: Nichtparametrische Regression**

Im Kontext der Regression wird ein privatisierter Schätzer $\tilde{m}_n(x)$ für die Regressionsfunktion $m(x) = \mathbb{E}[Y|X=x]$ definiert:

$$
\tilde{m}_n(x) = \frac{\tilde{\nu}_n(A_{h_n,j})}{\tilde{\mu}_n(A_{h_n,j})} \cdot I_{\{\tilde{\mu}_n(A_{h_n,j}) \geq c_n h_n^d\}} \quad \text{für } x \in A_{h_n,j}
$$

Dabei sind:
- $\tilde{\nu}_n(A_{h,j}) = \frac{1}{n} \sum_{i=1}^n Z_{i,j}$ – privatisierte Response-Summe
- $\tilde{\mu}_n(A_{h,j}) = \frac{1}{n} \sum_{i=1}^n W_{i,j}$ – privatisierte Häufigkeit

---

### ✅ **Starke universelle Konsistenz**

Unter geeigneten Bedingungen ($h_n \to 0$, $c_n \to 0$, $M_n \to \infty$ und $\frac{(\log n)^3}{n c_n^2 h_n^{2d}} \to 0$) ist der Schätzer $\tilde{m}_n$ **stark universell konsistent**:

$$
\lim_{n \to \infty} \int (m(x) - \tilde{m}_n(x))^2 \mu(dx) = 0 \quad \text{fast sicher}
$$

---

### ⚖️ **Vor- und Nachteile**

**Vorteile:**
- Keine Notwendigkeit eines vertrauenswürdigen Dritten
- Individuelle Datenschutzgarantie
- Breite Anwendbarkeit auf verschiedene statistische Probleme

**Herausforderungen:**
- Höhere Varianz durch das Rauschen
- Strengere Bedingungen für Konsistenz (z.B. $n h_n^{2d} \to \infty$ statt $n h_n^d \to \infty$)
- Komplexere Schätzerkonstruktion

---

### 🔄 **Erweiterung auf Klassifikation**

Die Methoden lassen sich auf binäre Klassifikation übertragen. Die Entscheidungsregel:

$$
g_n(x) = \text{sign}(\tilde{\nu}_n(A_{h_n,j})) \quad \text{für } x \in A_{h_n,j}
$$

ist ebenfalls stark universell konsistent unter ähnlichen Bedingungen.