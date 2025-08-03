document.getElementById("geolocate").addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocalizzazione non supportata.");
    return;
  }

  navigator.geolocation.getCurrentPosition(success, error);

  function success(position) {
    const { latitude, longitude } = position.coords;
    fetch(`https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`)
      .then(response => response.json())
      .then(data => {
        document.getElementById("location").value = data.display_name;
      });
  }

  function error() {
    alert("Impossibile ottenere la posizione.");
  }
});

document.getElementById("generate").addEventListener("click", async () => {
  const location = document.getElementById("location").value.trim();
  if (!location) {
    alert("Inserisci una posizione!");
    return;
  }

  // Mostra il messaggio di caricamento e nasconde i risultati
  document.getElementById("loading").classList.remove("hidden");
  document.getElementById("results").classList.add("hidden");

  const hour = new Date().getHours();
  const prompt = `
Mi trovo a "${location}" e sono le ${hour}:00. 
Suggeriscimi:
1. Una sezione chiamata "ATTIVITÀ E COSE DA FARE" con elenco puntato di cose da fare (locali, musei, mostre, cinema, eventi, ecc.) vicini alla mia posizione. Includi link se disponibili.
2. Una seconda sezione chiamata "ITINERARIO" con orari precisi e attività da svolgere in ordine cronologico, come una tabella di marcia. 
Mantieni una divisione ben visibile tra le due sezioni.`;

  try {
    const response = await fetch("/.netlify/functions/gpt", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const output = data.response;

    function parseMarkdownLinks(text) {
      return text.replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    }

    // Parsing con prompt strutturato
    const parts = output.split(/ITINERARIO/i);
    const activitiesText = parts[0]?.split(/ATTIVITÀ E COSE DA FARE/i)[1]?.trim() || "Nessuna attività trovata.";
    const itineraryText = parts[1]?.trim() || "Nessun itinerario suggerito.";

    // Inserisci le attività con link HTML
    document.getElementById("activities").innerHTML = parseMarkdownLinks(activitiesText);

    // Format itinerario in lista a blocchi
    const itineraryList = itineraryText
      .split(/\n+/)
      .filter(line => line.trim())
      .map(line => `<li>${line.trim()}</li>`)
      .join("");

    document.getElementById("itinerary").classList.add("timeline");
    document.getElementById("itinerary").innerHTML = `<ul>${itineraryList}</ul>`;

    // Nasconde il loading e mostra i risultati
    document.getElementById("loading").classList.add("hidden");
    document.getElementById("results").classList.remove("hidden");

  } catch (err) {
    document.getElementById("loading").classList.add("hidden");
    alert("Errore: " + err.message);
  }
});

function copyContent(id) {
  const text = document.getElementById(id).textContent;
  navigator.clipboard.writeText(text)
    .then(() => alert("Contenuto copiato!"))
    .catch(() => alert("Errore durante la copia"));
}