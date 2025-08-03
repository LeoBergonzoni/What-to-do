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

  let promptDate = new Date();
  let useCustomDate = document.querySelector('input[name="time"]:checked').value === "custom";
  const selectedDateInput = document.getElementById("custom-date").value;
  
  if (useCustomDate && selectedDateInput) {
    promptDate = new Date(selectedDateInput);
  }
  
  const day = promptDate.toLocaleDateString("it-IT", { weekday: 'long' });
  const date = promptDate.toLocaleDateString("it-IT");
  const hour = new Date().getHours();
  
  const prompt = `
  Mi trovo a "${location}" e vorrei fare qualcosa ${useCustomDate ? `il giorno ${day} ${date}` : `oggi alle ${hour}:00`}.
  Dividi la tua risposta in due sezioni con intestazioni chiare:
  
  ### ATTIVITÀ E COSE DA FARE
  Elenca solo le attività o luoghi consigliati (es. locali, eventi, musei, mercati, ristoranti, cinema...) in elenco puntato. Ogni punto deve contenere una descrizione sintetica + un link se disponibile, in formato Markdown.
  
  ### ITINERARIO
  Crea un elenco di orari e tappe, ognuna con una breve descrizione. Scrivi tutto in elenco puntato (es. “**14:00** – Visita al [Museo Morandi](https://...)”).
  
  Evita frasi introduttive, conclusioni o elementi inutili. Solo contenuti utili e ordinati.
  `;

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

    // Funzione per convertire link Markdown in <a>
    function parseMarkdownLinks(text) {
      return text
        .replace(/\*\*/g, '') // Rimuove doppie **
        .replace(/\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
    }

    // Pulisce output e divide in due sezioni
    const cleanOutput = output.replace(/\*\*/g, '');
    const parts = cleanOutput.split(/### ITINERARIO/i);

    const activitiesText = parts[0]?.split(/### ATTIVITÀ E COSE DA FARE/i)[1]?.trim() || "Nessuna attività trovata.";
    const itineraryText = parts[1]?.trim() || "Nessun itinerario suggerito.";

    // Attività con link cliccabili
    document.getElementById("activities").innerHTML = parseMarkdownLinks(activitiesText);

    // Itinerario formattato con link
    const itineraryItems = itineraryText
      .split(/\n+/)
      .filter(line => line.trim())
      .map(line => `<li>${parseMarkdownLinks(line.trim())}</li>`)
      .join("");

    document.getElementById("itinerary").classList.add("timeline");
    document.getElementById("itinerary").innerHTML = `<ul>${itineraryItems}</ul>`;

    // Mostra i risultati e nasconde il messaggio di caricamento
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
const radioButtons = document.querySelectorAll('input[name="time"]');
const customDateContainer = document.getElementById("custom-date-container");

radioButtons.forEach(radio => {
  radio.addEventListener("change", () => {
    customDateContainer.classList.toggle("hidden", document.querySelector('input[name="time"]:checked').value === "now");
  });
});

document.getElementById("alternative").addEventListener("click", () => {
  document.getElementById("generate").click();
});